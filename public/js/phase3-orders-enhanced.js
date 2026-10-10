// Phase 3 - Enhanced Orders + Dashboard Payment Summary
(function () {
    let phase3Orders = [];

    // Use the global helper when available; otherwise create a safe fallback.
    function phase3ApiFetch(url, options = {}) {
        if (typeof window.apiFetch === "function") {
            return window.apiFetch(url, options);
        }
        const token = localStorage.getItem("crmToken");
        const headers = new Headers(options.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(url, { ...options, headers });
    }

    const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

    async function getOrders() {
        const response = await phase3ApiFetch("/api/orders");
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Unable to load orders");
        return data.orders || [];
    }

    function remaining(order) {
        return Math.max(0, Number(order.totalAmount || 0) - Number(order.amountPaid || 0));
    }

    function renderOrderSummary(orders) {
        const billing = orders.reduce((s,o)=>s+Number(o.totalAmount||0),0);
        const total = orders.reduce((s,o)=>s+Math.max(0,Math.min(Number(o.amountPaid||0),Number(o.totalAmount||0))),0);
        const pending = Math.max(0,billing-total);
        const count = orders.length;

        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        set("ordersTotalValue", money(total));
        set("ordersBillingValue", money(billing));
        set("ordersPendingValue", money(pending));
        set("ordersCountValue", count);
    }

    function getFilters() {
        return {
            search: (document.getElementById("orderSearch")?.value || "").trim().toLowerCase(),
            payment: document.getElementById("orderPaymentFilter")?.value || "all",
            status: document.getElementById("orderStatusFilter")?.value || "all",
            staff: document.getElementById("orderStaffFilter")?.value || "all",
            source: document.getElementById("orderSourceFilter")?.value || "all",
            date: document.getElementById("orderDateFilter")?.value || ""
        };
    }

    function filterOrders() {
        const f = getFilters();
        return phase3Orders.filter(order => {
            const customer = order.customer || {};
            const haystack = [
                customer.name,
                customer.phone,
                order.product,
                order.product
            ].filter(Boolean).join(" ").toLowerCase();

            if (f.search && !haystack.includes(f.search)) return false;
            if (f.payment !== "all" && (order.paymentStatus || "Pending") !== f.payment) return false;
            if (f.status !== "all" && (order.orderStatus || "New") !== f.status) return false;
            if (f.staff !== "all" && String(order.assignedTo?._id || order.assignedTo || "") !== String(f.staff)) return false;
            if (f.source !== "all" && (order.source || "Other") !== f.source) return false;

            if (f.date) {
                const d = new Date(order.orderDate || order.createdAt);
                const local = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
                if (local !== f.date) return false;
            }
            return true;
        });
    }

    function renderOrders(orders) {
        const table = document.getElementById("ordersTable");
        if (!table) return;

        if (!orders.length) {
            table.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:24px;">No matching orders found</td></tr>';
            return;
        }

        table.innerHTML = orders.map(order => {
            const customer = order.customer || {};
            const pending = remaining(order);
            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN") : "-";
            const paymentStatus = order.paymentStatus || "Pending";
            const paymentClass = paymentStatus.toLowerCase();
            const safePhone = String(customer.phone || "").replace(/[^0-9+]/g, "");

            return `
                <tr>
                    <td><strong>${customer.name || "-"}</strong><div class="table-subtext">${customer.company || ""}</div></td>
                    <td><span class="staff-badge">👤 ${order.assignedTo?.name || "Unassigned"}</span></td>
                    <td>${customer.phone || "-"}</td>
                    <td><strong>${order.source || "Other"}</strong><div class="table-subtext">${order.sourceType || ""}</div></td>
                    <td>${order.product || "-"}</td>
                    <td>${order.quantity || 1}</td>
                    <td>${money(order.price)}</td>
                    <td><strong>${money(order.totalAmount)}</strong></td>
                    <td>${money(order.amountPaid)}</td>
                    <td><strong>${money(pending)}</strong></td>
                    <td><span class="payment-status ${paymentClass}">${paymentStatus}</span></td>
                    <td><span class="order-status">${order.orderStatus || "New"}</span></td>
                    <td>${orderDate}</td>
                    <td>
                        ${safePhone ? `<a href="tel:${safePhone}"><button type="button">📞</button></a>` : ""}
                        ${safePhone ? `<a href="https://wa.me/${safePhone}" target="_blank"><button type="button">🟢</button></a>` : ""}
                        <a href="customer-history.html?id=${customer._id || ""}" title="Customer payment & purchase history"><button type="button">📊</button></a>
                        <button type="button" onclick="editOrder('${order._id}')">✏️</button>
                        <button type="button" onclick="deleteOrder('${order._id}')">🗑️</button>
                    </td>
                </tr>`;
        }).join("");
    }

    function applyFilters() {
        renderOrders(filterOrders());
    }

    async function loadOrderStaffFilter() {
        const select = document.getElementById("orderStaffFilter");
        if (!select) return;
        try {
            const user = JSON.parse(localStorage.getItem("crmUser") || "null");
            if (user?.role !== "admin") { select.style.display = "none"; return; }
            const response = await phase3ApiFetch("/api/users/staff");
            const data = await response.json();
            if (!data.success) return;
            select.innerHTML = '<option value="all">All Staff</option>' + [...new Map((data.users || []).filter(u => u && u._id).map(u => [String(u._id), u])).values()].map(u => `<option value="${u._id}">${u.name}</option>`).join("");
        } catch (e) { console.error("Order staff filter error", e); }
    }

    async function initOrdersPage() {
        if (!document.getElementById("ordersTable")) return;
        try {
            phase3Orders = await getOrders();
            await loadOrderStaffFilter();
            renderOrderSummary(phase3Orders);
            renderOrders(phase3Orders);

            ["orderSearch", "orderPaymentFilter", "orderStaffFilter", "orderSourceFilter", "orderStatusFilter", "orderDateFilter"].forEach(id => {
                document.getElementById(id)?.addEventListener(id === "orderSearch" ? "input" : "change", applyFilters);
            });

            document.getElementById("clearOrderFilters")?.addEventListener("click", () => {
                document.getElementById("orderSearch").value = "";
                document.getElementById("orderPaymentFilter").value = "all";
                document.getElementById("orderStaffFilter").value = "all";
                document.getElementById("orderSourceFilter").value = "all";
                document.getElementById("orderStatusFilter").value = "all";
                document.getElementById("orderDateFilter").value = "";
                applyFilters();
            });
        } catch (error) {
            console.error("Enhanced Orders Error:", error);
        }
    }

    async function updateDashboardPaymentSummary() {
        if (!document.getElementById("totalSales") && !document.getElementById("pendingPayments")) return;
        try {
            const orders = await getOrders();
            const totalSales = orders.reduce((s,o)=>s+Math.max(0,Math.min(Number(o.amountPaid||0),Number(o.totalAmount||0))),0);
            const pending = orders.reduce((s, o) => s + remaining(o), 0);

            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            set("totalSales", money(totalSales));
            set("pendingPayments", money(pending));
        } catch (error) {
            console.error("Dashboard Payment Summary Error:", error);
        }
    }

    window.addEventListener("load", function () {
        initOrdersPage();
        updateDashboardPaymentSummary();
    });
})();

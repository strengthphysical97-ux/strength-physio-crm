// ==========================================
// AUTHENTICATED API HELPER
// ==========================================

function apiFetch(url, options = {}) {
    const token = localStorage.getItem("crmToken");
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
}

const leadForm = document.getElementById("leadForm");


// ===============================
// ADD NEW LEAD
// ===============================

if (leadForm) {

    leadForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const leadData = {
            name: document.getElementById("name").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            product: document.getElementById("product").value,
            source: document.getElementById("source").value,
            status: document.getElementById("status").value,
            followUpDate: document.getElementById("followUpDate").value,
            notes: document.getElementById("notes").value,
            assignedTo: document.getElementById("assignedTo")?.value || ""
        };

        try {

            // LOGIN TOKEN
            const token = localStorage.getItem("crmToken");

            const response = await fetch("/api/leads", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",

                    // JWT TOKEN
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(leadData)

            });

            const data = await response.json();

            if (data.success) {

                document.getElementById("message").innerText =
                    "Lead added successfully!";

                leadForm.reset();

            } else {

                document.getElementById("message").innerText =
                    data.message;

            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").innerText =
                "Server error.";

        }

    });

}


// ===============================
// GET ALL LEADS
// ===============================

const leadsTable = document.getElementById("leadsTable");
let allLeadsData = [];

if (leadsTable) {

    loadLeads();
    loadStaffFilter();

}



async function loadLeads() {

    try {

        // Login token
        const token = localStorage.getItem("crmToken");

        const response = await fetch("/api/leads", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (!data.success) {

            leadsTable.innerHTML =
                "<tr><td colspan='8'>Unable to load leads</td></tr>";

            return;
        }

        allLeadsData = data.leads;
displayLeads(data.leads);

    } catch (error) {

        console.error(error);

        leadsTable.innerHTML =
            "<tr><td colspan='8'>Server error</td></tr>";
    }

}
// ===============================
// LOAD STAFF FILTER
// ===============================

async function loadStaffFilter() {
    try {
        const token = localStorage.getItem("crmToken");

        const response = await fetch("/api/users/staff", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            return;
        }

        const staffFilter = document.getElementById("staffFilter");

        if (!staffFilter) {
            return;
        }

        data.users.forEach(function (user) {
            if (String(user.role).toLowerCase() === "staff") {
                const option = document.createElement("option");

                option.value = user._id;
                option.textContent = user.name;

                staffFilter.appendChild(option);
            }
        });

    } catch (error) {
        console.error("Staff Filter Error:", error);
    }
}
// ===============================
// STAFF FILTER
// ===============================

const staffFilter = document.getElementById("staffFilter");

if (staffFilter) {
    staffFilter.addEventListener("change", function () {

        const selectedStaff = this.value;

        // All Staff selected
        if (selectedStaff === "All") {
            displayLeads(allLeadsData);
            return;
        }

        // Specific staff selected
        const filteredLeads = allLeadsData.filter(function (lead) {

            return (
                (lead.assignedTo && String(lead.assignedTo._id) === String(selectedStaff)) ||
                (lead.createdBy && String(lead.createdBy._id) === String(selectedStaff))
            );

        });

        displayLeads(filteredLeads);

    });
}
// ===============================
// DISPLAY LEADS
// ===============================

function displayLeads(leads) {

    if (leads.length === 0) {

        leadsTable.innerHTML =
            "<tr><td colspan='6'>No leads found</td></tr>";

        return;
    }

    leadsTable.innerHTML = "";

    leads.forEach(function (lead) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${lead.name}</td>

            <td>${lead.phone}</td>

            <td>${lead.product || "-"}</td>

            <td>${lead.source}</td>

            <td>${lead.status}</td>
            <td>
    ${
        lead.assignedTo?.name ||
        lead.createdBy?.name ||
        "Unassigned"
    }
</td>

            <td>
                ${lead.followUpDate
                ? new Date(lead.followUpDate).toLocaleDateString()
                : "-"
            }
            </td>
             <td>

    <a href="tel:${lead.phone}">
        <button type="button">
            📞 Call
        </button>
    </a>

    <a href="https://wa.me/${lead.phone}" target="_blank">
        <button type="button">
            🟢 WhatsApp
        </button>
    </a>

    <button type="button" onclick="editLead('${lead._id}')">
        ✏️ Edit
    </button>

    <button type="button" onclick="deleteLead('${lead._id}')">
        🗑️ Delete
    </button>

</td>
        `;

        leadsTable.appendChild(row);

    });

}
async function deleteLead(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        // Login token
        const token = localStorage.getItem("crmToken");

        const response = await fetch(`/api/leads/${id}`, {

            method: "DELETE",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (data.success) {

            alert("Lead deleted successfully!");

            loadLeads();

        } else {

            alert(data.message);

        }

    } catch (error) {

        console.error(error);

        alert("Server error.");

    }
}


// ===============================
// EDIT LEAD
// ===============================

async function editLead(id) {

    window.location.href = `/edit-lead.html?id=${id}`;

}


// ===============================
// LOAD LEAD FOR EDIT
// ===============================

const editLeadForm = document.getElementById("editLeadForm");

if (editLeadForm) {

    const urlParams =
        new URLSearchParams(window.location.search);

    const leadId =
        urlParams.get("id");

    if (!leadId) {

        document.getElementById("message").innerText =
            "Lead ID missing.";

    } else {

        loadLeadForEdit(leadId);


        editLeadForm.addEventListener(
            "submit",
            async function (e) {

                e.preventDefault();


                const updatedData = {

                    name:
                        document.getElementById("name").value,

                    phone:
                        document.getElementById("phone").value,

                    email:
                        document.getElementById("email").value,

                    product:
                        document.getElementById("product").value,

                    source:
                        document.getElementById("source").value,

                    status:
                        document.getElementById("status").value,

                    followUpDate:
                        document.getElementById("followUpDate").value,

                    notes:
                        document.getElementById("notes").value,

                    assignedTo:
                        document.getElementById("assignedTo")?.value || ""

                };


                try {

                    // ===============================
                    // LOGIN TOKEN
                    // ===============================

                    const token =
                        localStorage.getItem("crmToken");


                    const response =
                        await fetch(
                            `/api/leads/${leadId}`,
                            {

                                method: "PUT",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`

                                },

                                body:
                                    JSON.stringify(updatedData)

                            }
                        );


                    const data =
                        await response.json();


                    if (data.success) {

                        document
                            .getElementById("message")
                            .innerText =
                            "Lead updated successfully!";

                    } else {

                        document
                            .getElementById("message")
                            .innerText =
                            "Error: " +
                            data.message;

                    }

                } catch (error) {

                    console.error(error);

                    document
                        .getElementById("message")
                        .innerText =
                        "Server error.";

                }

            }
        );

    }

}

// ===============================
// LOAD LEAD DATA
// ===============================

async function loadLeadForEdit(id) {

    try {

        // Login token
        const token = localStorage.getItem("crmToken");

        const response = await fetch("/api/leads", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (!data.success) {

            document.getElementById("message").innerText =
                data.message || "Unable to load lead.";

            return;
        }

        const lead = data.leads.find(
            item => item._id === id
        );


        if (!lead) {

            document.getElementById("message").innerText =
                "Lead not found.";

            return;
        }


        document.getElementById("name").value =
            lead.name || "";

        document.getElementById("phone").value =
            lead.phone || "";

        document.getElementById("email").value =
            lead.email || "";

        document.getElementById("product").value =
            lead.product || "";

        document.getElementById("source").value =
            lead.source || "Other";

        document.getElementById("status").value =
            lead.status || "New";


        if (lead.followUpDate) {

            document.getElementById("followUpDate").value =
                new Date(lead.followUpDate)
                    .toISOString()
                    .split("T")[0];

        }


        document.getElementById("notes").value =
            lead.notes || "";

        const assignedSelect = document.getElementById("assignedTo");
        if (assignedSelect) {
            await loadAssignedStaff(assignedSelect, lead.assignedTo?._id || "");
        }


    } catch (error) {

        console.error(error);

        document.getElementById("message").innerText =
            "Unable to load lead.";

    }

}
// ===============================
// SEARCH LEADS
// ===============================

const searchLead = document.getElementById("searchLead");

if (searchLead) {

    searchLead.addEventListener("input", function () {

        const searchText = searchLead.value.toLowerCase();

        const rows = leadsTable.querySelectorAll("tr");

        rows.forEach(function (row) {

            const rowText = row.innerText.toLowerCase();

            if (rowText.includes(searchText)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}
// ===============================
// STATUS FILTER
// ===============================

const statusFilter = document.getElementById("statusFilter");

if (statusFilter) {

    statusFilter.addEventListener("change", function () {

        const selectedStatus = statusFilter.value;

        const rows = leadsTable.querySelectorAll("tr");

        rows.forEach(function (row) {

            if (selectedStatus === "All") {

                row.style.display = "";

                return;
            }

            const statusCell = row.children[4];

            if (!statusCell) {
                return;
            }

            const leadStatus = statusCell.innerText.trim();

            if (leadStatus === selectedStatus) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}
// ===============================
// PHASE 2 STAFF ASSIGNMENT
// ===============================

async function loadAssignedStaff(selectElement, selectedId = "") {
    if (!selectElement) return;

    try {
        const response = await apiFetch("/api/users/staff");
        const data = await response.json();
        if (!data.success) return;

        const user = JSON.parse(localStorage.getItem("crmUser") || "{}");
        const isAdmin = user.role === "admin";

        selectElement.innerHTML = isAdmin
            ? '<option value="">Select Staff</option>'
            : '<option value="">Myself</option>';

        data.users.forEach(function (staff) {
            const option = document.createElement("option");
            option.value = staff._id;
            option.textContent = staff.name;
            if (String(staff._id) === String(selectedId)) option.selected = true;
            selectElement.appendChild(option);
        });

        if (!isAdmin) {
            const me = user.id || user._id;
            if (me) selectElement.value = me;
            selectElement.disabled = true;
            selectElement.closest("div")?.classList.add("staff-assignment-disabled");
        }
    } catch (error) {
        console.error("Assignment staff error:", error);
    }
}

const assignedToSelect = document.getElementById("assignedTo");
if (assignedToSelect) {
    loadAssignedStaff(assignedToSelect);
}

// ===============================
// DASHBOARD LEAD COUNTS
// ===============================

const totalLeads = document.getElementById("totalLeads");

if (totalLeads) {
    loadDashboard();
}

async function loadDashboard() {

    try {

        const response = await fetch("/api/leads");

        const data = await response.json();

        if (!data.success) {
            return;
        }

        const leads = data.leads;

        document.getElementById("totalLeads").innerText =
            leads.length;

        document.getElementById("newLeads").innerText =
            leads.filter(lead => lead.status === "New").length;

        document.getElementById("contactedLeads").innerText =
            leads.filter(lead => lead.status === "Contacted").length;

        document.getElementById("interestedLeads").innerText =
            leads.filter(lead => lead.status === "Interested").length;

        document.getElementById("followUpLeads").innerText =
            leads.filter(lead => lead.status === "Follow-up").length;

        document.getElementById("convertedLeads").innerText =
            leads.filter(lead => lead.status === "Converted").length;

        document.getElementById("lostLeads").innerText =
            leads.filter(lead => lead.status === "Lost").length;

    } catch (error) {

        console.error("Dashboard Error:", error);

    }

}
// ===============================
// LOAD CUSTOMERS
// ===============================

const customersTable = document.getElementById("customersTable");

if (customersTable) {
    loadCustomers();
}

async function loadCustomers() {

    try {

        const response = await apiFetch("/api/customers");

        const data = await response.json();

        if (!data.success) {

            customersTable.innerHTML =
                "<tr><td colspan='7'>Unable to load customers</td></tr>";

            return;
        }

        displayCustomers(data.customers);

    } catch (error) {

        console.error(error);

        customersTable.innerHTML =
            "<tr><td colspan='7'>Server error</td></tr>";

    }

}


// ===============================
// DISPLAY CUSTOMERS
// ===============================

function displayCustomers(customers) {

    if (customers.length === 0) {

        customersTable.innerHTML =
            "<tr><td colspan='7'>No customers found</td></tr>";

        return;
    }

    customersTable.innerHTML = "";

    customers.forEach(function (customer) {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${customer.name}</td>

            <td>${customer.phone}</td>

            <td>${customer.email || "-"}</td>

            <td>${customer.company || "-"}</td>

            <td>${customer.city || "-"}</td>

            <td>${customer.assignedTo?.name || "Unassigned"}</td>

            <td>

    <a href="tel:${customer.phone}">
        <button type="button">📞 Call</button>
    </a>

    <a href="https://wa.me/${customer.phone}" target="_blank">
        <button type="button">🟢 WhatsApp</button>
    </a>

    <button type="button" onclick="editCustomer('${customer._id}')">
        ✏️ Edit
    </button>

    <button type="button" onclick="deleteCustomer('${customer._id}')">
        🗑️ Delete
    </button>

</td>
        `;

        customersTable.appendChild(row);

    });

}
// ===============================
// ADD NEW CUSTOMER
// ===============================

async function populateStaffSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const user = JSON.parse(localStorage.getItem("crmUser") || "null");
    if (!user || user.role !== "admin") return;
    try {
        const response = await apiFetch("/api/users/staff");
        const data = await response.json();
        if (!data.success) return;

        // Keep the first placeholder and rebuild the staff options so repeated
        // calls can never append the same staff multiple times.
        const firstOption = select.options[0] ? select.options[0].cloneNode(true) : null;
        select.innerHTML = "";
        if (firstOption) select.appendChild(firstOption);

        const seen = new Set();
        (data.users || []).forEach(staff => {
            const key = String(staff._id || staff.email || staff.name || "").toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            const option = document.createElement("option");
            option.value = staff._id;
            option.textContent = staff.name;
            select.appendChild(option);
        });
    } catch (e) { console.error("Staff loading error", e); }
}
populateStaffSelect("assignedTo");

const customerForm = document.getElementById("customerForm");

if (customerForm) {

    customerForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const customerData = {

            name: document.getElementById("name").value,

            phone: document.getElementById("phone").value,

            email: document.getElementById("email").value,

            company: document.getElementById("company").value,

            address: document.getElementById("address").value,

            city: document.getElementById("city").value,

            notes: document.getElementById("notes").value,
            assignedTo: document.getElementById("assignedTo")?.value || ""

        };

        try {

            const response = await apiFetch("/api/customers", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(customerData)

            });

            const data = await response.json();

            if (data.success) {

                document.getElementById("message").innerText =
                    "Customer added successfully!";

                customerForm.reset();

            } else {

                document.getElementById("message").innerText =
                    data.message;

            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").innerText =
                "Server error.";

        }

    });

}
// ===============================
// EDIT CUSTOMER
// ===============================

async function editCustomer(id) {

    window.location.href = `/edit-customer.html?id=${id}`;

}


// ===============================
// DELETE CUSTOMER
// ===============================

async function deleteCustomer(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this customer?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await apiFetch(`/api/customers/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (data.success) {

            alert("Customer deleted successfully!");

            loadCustomers();

        } else {

            alert(data.message);

        }

    } catch (error) {

        console.error(error);

        alert("Server error.");

    }

}
// ===============================
// LOAD CUSTOMER FOR EDIT
// ===============================

const editCustomerForm = document.getElementById("editCustomerForm");

if (editCustomerForm) {

    const urlParams = new URLSearchParams(window.location.search);

    const customerId = urlParams.get("id");

    if (!customerId) {

        document.getElementById("message").innerText =
            "Customer ID missing.";

    } else {

        loadCustomerForEdit(customerId);

        editCustomerForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const updatedData = {

                name: document.getElementById("name").value,

                phone: document.getElementById("phone").value,

                email: document.getElementById("email").value,

                company: document.getElementById("company").value,

                address: document.getElementById("address").value,

                city: document.getElementById("city").value,

                notes: document.getElementById("notes").value

            };

            try {

                const response = await fetch(
                    `/api/customers/${customerId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(updatedData)
                    }
                );

                const data = await response.json();

                if (data.success) {

                    document.getElementById("message").innerText =
                        "Customer updated successfully!";

                } else {

                    document.getElementById("message").innerText =
                        "Error: " + data.message;

                }

            } catch (error) {

                console.error(error);

                document.getElementById("message").innerText =
                    "Server error.";

            }

        });

    }

}


// ===============================
// LOAD CUSTOMER DATA
// ===============================

async function loadCustomerForEdit(id) {

    try {

        const response = await apiFetch("/api/customers");

        const data = await response.json();

        const customer = data.customers.find(
            item => item._id === id
        );

        if (!customer) {

            document.getElementById("message").innerText =
                "Customer not found.";

            return;

        }

        document.getElementById("name").value =
            customer.name || "";

        document.getElementById("phone").value =
            customer.phone || "";

        document.getElementById("email").value =
            customer.email || "";

        document.getElementById("company").value =
            customer.company || "";

        document.getElementById("address").value =
            customer.address || "";

        document.getElementById("city").value =
            customer.city || "";

        document.getElementById("notes").value =
            customer.notes || "";

    } catch (error) {

        console.error(error);

        document.getElementById("message").innerText =
            "Unable to load customer.";

    }

}
// ===============================
// SEARCH CUSTOMERS
// ===============================

const searchCustomer = document.getElementById("searchCustomer");

if (searchCustomer) {

    searchCustomer.addEventListener("input", function () {

        const searchText =
            searchCustomer.value.toLowerCase();

        const rows =
            customersTable.querySelectorAll("tr");

        rows.forEach(function (row) {

            const rowText =
                row.innerText.toLowerCase();

            if (rowText.includes(searchText)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

}
// ===============================
// LOAD CUSTOMERS IN ORDER FORM
// ===============================

const customerSelect = document.getElementById("customer");

if (customerSelect) {

    loadCustomersForOrder();

}

async function loadCustomersForOrder() {

    try {

        const response = await apiFetch("/api/customers");

        const data = await response.json();

        if (!data.success) {
            return;
        }

        data.customers.forEach(function (customer) {

            const option = document.createElement("option");

            option.value = customer._id;

            option.textContent =
                `${customer.name} - ${customer.phone}`;

            customerSelect.appendChild(option);

        });

    } catch (error) {

        console.error("Customer loading error:", error);

    }

}
function setupOrderPaymentFields() {
    const total = document.getElementById("totalAmount");
    const qty = document.getElementById("quantity");
    const price = document.getElementById("price");
    const delivery = document.getElementById("deliveryCharge");
    const gstEnabled = document.getElementById("gstEnabled");
    const gstPercent = document.getElementById("gstPercent");
    const paymentStatus = document.getElementById("paymentStatus");
    const amountPaid = document.getElementById("amountPaid");
    if (!total || !qty || !price || !delivery || !gstEnabled || !gstPercent || !paymentStatus || !amountPaid) return;

    function recalculate() {
        const base = Math.max(0, Number(qty.value || 0) * Number(price.value || 0));
        const deliveryAmount = Math.max(0, Number(delivery.value || 0));
        const gst = gstEnabled.checked ? base * Math.max(0, Number(gstPercent.value || 0)) / 100 : 0;
        total.value = (base + deliveryAmount + gst).toFixed(2);
        gstPercent.disabled = !gstEnabled.checked;
        if (paymentStatus.value === "Paid") amountPaid.value = total.value;
        if (paymentStatus.value === "Pending") amountPaid.value = "0";
        amountPaid.max = total.value;
    }

    [qty, price, delivery, gstPercent].forEach(el => el.addEventListener("input", recalculate));
    gstEnabled.addEventListener("change", recalculate);
    paymentStatus.addEventListener("change", () => {
        if (paymentStatus.value === "Paid") amountPaid.value = total.value || 0;
        else if (paymentStatus.value === "Pending") amountPaid.value = 0;
        amountPaid.max = total.value || 0;
    });
    amountPaid.addEventListener("input", () => {
        const paid = Number(amountPaid.value || 0);
        const t = Number(total.value || 0);
        if (paid <= 0) paymentStatus.value = "Pending";
        else if (paid >= t) paymentStatus.value = "Paid";
        else paymentStatus.value = "Partial";
    });
    recalculate();
}

// ===============================
// ADD NEW ORDER
// ===============================

populateStaffSelect("assignedTo");

const orderForm = document.getElementById("orderForm");

if (orderForm) {

    setupOrderPaymentFields();

    orderForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const orderData = {

            customer: document.getElementById("customer").value,

            assignedTo: document.getElementById("assignedTo")?.value || "",

            product: document.getElementById("product").value,

            quantity: Number(
                document.getElementById("quantity").value
            ),

            price: Number(
                document.getElementById("price").value
            ),

            totalAmount: Number(document.getElementById("totalAmount").value || 0),
            deliveryCharge: Number(document.getElementById("deliveryCharge").value || 0),
            gstEnabled: document.getElementById("gstEnabled").checked,
            gstPercent: Number(document.getElementById("gstPercent").value || 0),
            paymentStatus: document.getElementById("paymentStatus").value,
            amountPaid: Number(document.getElementById("amountPaid").value || 0),

            orderStatus:
                document.getElementById("orderStatus").value,

            orderDate:
                document.getElementById("orderDate").value || undefined,

            notes:
                document.getElementById("notes").value

        };

        try {

            const response = await apiFetch("/api/orders", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(orderData)

            });

            const data = await response.json();

            if (data.success) {

                document.getElementById("message").innerText =
                    "Order added successfully!";

                orderForm.reset();

            } else {

                document.getElementById("message").innerText =
                    data.message;

            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").innerText =
                "Server error.";

        }

    });

}
// ===============================
// LOAD ORDERS
// ===============================

const ordersTable = document.getElementById("ordersTable");

if (ordersTable && !window.ENHANCED_ORDERS) {
    loadOrders();
}

async function loadOrders() {

    try {

        const response = await apiFetch("/api/orders");

        const data = await response.json();

        if (!data.success) {

            ordersTable.innerHTML =
                "<tr><td colspan='12'>Unable to load orders</td></tr>";

            return;
        }

        displayOrders(data.orders);

    } catch (error) {

        console.error(error);

        ordersTable.innerHTML =
            "<tr><td colspan='12'>Server error</td></tr>";

    }

}


// ===============================
// DISPLAY ORDERS
// ===============================

function displayOrders(orders) {

    if (orders.length === 0) {

        ordersTable.innerHTML =
            "<tr><td colspan='12'>No orders found</td></tr>";

        return;
    }

    ordersTable.innerHTML = "";

    orders.forEach(function (order) {

        const row = document.createElement("tr");

        const customerName =
            order.customer ? order.customer.name : "-";

        const customerPhone =
            order.customer ? order.customer.phone : "-";

        const orderDate =
            order.orderDate
                ? new Date(order.orderDate).toLocaleDateString()
                : "-";

        row.innerHTML = `

            <td>${customerName}</td>

            <td>${customerPhone}</td>

            <td>${order.product}</td>

            <td>${order.quantity}</td>

            <td>₹${order.price}</td>

            <td>₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</td>

            <td>₹${Number(order.amountPaid || 0).toLocaleString("en-IN")}</td>

            <td>₹${Number(order.remainingAmount || 0).toLocaleString("en-IN")}</td>

            <td>${order.paymentStatus}</td>

            <td>${order.orderStatus}</td>

            <td>${orderDate}</td>

            <td>

    <a href="tel:${customerPhone}">
        <button type="button">📞 Call</button>
    </a>

    <a href="https://wa.me/${customerPhone}" target="_blank">
        <button type="button">🟢 WhatsApp</button>
    </a>

    <button type="button" onclick="editOrder('${order._id}')">
        ✏️ Edit
    </button>

    <button type="button" onclick="deleteOrder('${order._id}')">
        🗑️ Delete
    </button>

</td>

        `;

        ordersTable.appendChild(row);

    });

}
function setupEditOrderPaymentFields() {
    const total = document.getElementById("totalAmount");
    const qty = document.getElementById("quantity");
    const price = document.getElementById("price");
    const delivery = document.getElementById("deliveryCharge");
    const gstEnabled = document.getElementById("gstEnabled");
    const gstPercent = document.getElementById("gstPercent");
    const currentPaid = document.getElementById("currentAmountPaid");
    const additional = document.getElementById("additionalPayment");
    const amountPaid = document.getElementById("amountPaid");
    const pending = document.getElementById("pendingAmount");
    const status = document.getElementById("paymentStatus");
    if (!total || !qty || !price || !delivery || !gstEnabled || !gstPercent || !currentPaid || !additional || !amountPaid || !pending || !status) return;

    function recalculateEditPayment() {
        const base = Math.max(0, Number(qty.value || 0) * Number(price.value || 0));
        const deliveryAmount = Math.max(0, Number(delivery.value || 0));
        const gst = gstEnabled.checked ? base * Math.max(0, Number(gstPercent.value || 0)) / 100 : 0;
        const calculatedTotal = Number((base + deliveryAmount + gst).toFixed(2));
        total.value = calculatedTotal.toFixed(2);

        const existingPaid = Math.max(0, Number(currentPaid.value || 0));
        let extra = Math.max(0, Number(additional.value || 0));
        const finalPaid = Math.min(calculatedTotal, existingPaid + extra);
        amountPaid.value = finalPaid.toFixed(2);
        pending.value = Math.max(0, calculatedTotal - finalPaid).toFixed(2);
        additional.max = Math.max(0, calculatedTotal - existingPaid).toFixed(2);

        if (finalPaid <= 0) status.value = "Pending";
        else if (finalPaid >= calculatedTotal) status.value = "Paid";
        else status.value = "Partial";
    }

    [qty, price, delivery].forEach(el => el.addEventListener("input", recalculateEditPayment));
    additional.addEventListener("input", recalculateEditPayment);
    gstEnabled.disabled = true;
    gstPercent.disabled = true;
}

// ===============================
// EDIT ORDER
// ===============================

async function editOrder(id) {

    window.location.href = `/edit-order.html?id=${id}`;

}


// ===============================
// DELETE ORDER
// ===============================

async function deleteOrder(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this order?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await apiFetch(`/api/orders/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (data.success) {

            alert("Order deleted successfully!");

            loadOrders();

        } else {

            alert(data.message);

        }

    } catch (error) {

        console.error(error);

        alert("Server error.");

    }

}
// ===============================
// LOAD ORDER FOR EDIT
// ===============================

const editOrderForm = document.getElementById("editOrderForm");

if (editOrderForm) {

    setupEditOrderPaymentFields();

    const urlParams = new URLSearchParams(window.location.search);

    const orderId = urlParams.get("id");

    if (!orderId) {

        document.getElementById("message").innerText =
            "Order ID missing.";

    } else {

        loadOrderForEdit(orderId);

        editOrderForm.addEventListener("submit", async function(e) {

            e.preventDefault();

            const updatedData = {

                customer: document.getElementById("customer").value,

                product: document.getElementById("product").value,

                quantity: Number(
                    document.getElementById("quantity").value
                ),

                price: Number(
                    document.getElementById("price").value
                ),

                totalAmount: Number(document.getElementById("totalAmount").value || 0),
                deliveryCharge: Number(document.getElementById("deliveryCharge").value || 0),
                // GST values are intentionally not editable here; the server also locks them.
                amountPaid: Number(document.getElementById("amountPaid").value || 0),

                orderStatus:
                    document.getElementById("orderStatus").value,

                orderDate:
                    document.getElementById("orderDate").value,

                notes:
                    document.getElementById("notes").value

            };

            try {

                const response = await apiFetch(
                    `/api/orders/${orderId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(updatedData)
                    }
                );

                const data = await response.json();

                if (data.success) {

                    document.getElementById("message").innerText =
                        "Order updated successfully!";

                } else {

                    document.getElementById("message").innerText =
                        "Error: " + data.message;

                }

            } catch (error) {

                console.error(error);

                document.getElementById("message").innerText =
                    "Server error.";

            }

        });

    }

}


// ===============================
// LOAD ORDER DATA
// ===============================

async function loadOrderForEdit(id) {

    try {

        const [ordersResponse, customersResponse] =
            await Promise.all([
                apiFetch("/api/orders"),
                apiFetch("/api/customers")
            ]);

        const ordersData = await ordersResponse.json();
        const customersData = await customersResponse.json();

        const order = ordersData.orders.find(
            item => item._id === id
        );

        if (!order) {

            document.getElementById("message").innerText =
                "Order not found.";

            return;

        }

        // Fill customer dropdown

        const customerSelect =
            document.getElementById("customer");

        customerSelect.innerHTML =
            '<option value="">Select Customer</option>';

        customersData.customers.forEach(function(customer) {

            const option = document.createElement("option");

            option.value = customer._id;

            option.textContent =
                `${customer.name} - ${customer.phone}`;

            customerSelect.appendChild(option);

        });

        // Fill order details

        document.getElementById("customer").value =
            order.customer ? order.customer._id : "";

        document.getElementById("product").value =
            order.product || "";

        document.getElementById("quantity").value =
            order.quantity || 1;

        document.getElementById("price").value =
            order.price || 0;

        document.getElementById("deliveryCharge").value = order.deliveryCharge || 0;
        document.getElementById("gstEnabled").checked = !!order.gstEnabled;
        document.getElementById("gstPercent").value = order.gstPercent || 0;
        document.getElementById("totalAmount").value = order.totalAmount || 0;
        document.getElementById("currentAmountPaid").value = Number(order.amountPaid || 0).toFixed(2);
        document.getElementById("additionalPayment").value = "0";
        document.getElementById("amountPaid").value = Number(order.amountPaid || 0).toFixed(2);
        document.getElementById("pendingAmount").value = Math.max(0, Number(order.totalAmount || 0) - Number(order.amountPaid || 0)).toFixed(2);
        document.getElementById("paymentStatus").value = order.paymentStatus || "Pending";
        document.getElementById("gstEnabled").disabled = true;
        document.getElementById("gstPercent").disabled = true;

        document.getElementById("orderStatus").value =
            order.orderStatus || "New";

        if (order.orderDate) {

            document.getElementById("orderDate").value =
                new Date(order.orderDate)
                    .toISOString()
                    .split("T")[0];

        }

        document.getElementById("notes").value =
            order.notes || "";

    } catch (error) {

        console.error(error);

        document.getElementById("message").innerText =
            "Unable to load order.";

    }

}
// ===============================
// DASHBOARD LEAD STATS
// ===============================

const dashboardLeadStats = document.getElementById("totalLeads");

if (dashboardLeadStats) {
    loadDashboardLeadStats();
}

async function loadDashboardLeadStats() {

    try {

        const token = localStorage.getItem("crmToken");

        const response = await fetch("/api/leads", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            console.error("Lead Stats Error:", data.message);
            return;
        }

        let leads = data.leads || [];

        // Selected year
        const selectedYear =
            Number(document.getElementById("dashboardYear").value);

        // Selected month
        const selectedMonth =
            document.getElementById("dashboardMonth").value;


        // ===============================
        // FILTER BY YEAR
        // ===============================

        leads = leads.filter(function (lead) {

            const leadDate = new Date(lead.createdAt);

            return leadDate.getFullYear() === selectedYear;

        });


        // ===============================
        // FILTER BY MONTH
        // ===============================

        if (selectedMonth !== "all") {

            leads = leads.filter(function (lead) {

                const leadDate = new Date(lead.createdAt);

                return leadDate.getMonth() === Number(selectedMonth);

            });

        }


        // ===============================
        // UPDATE CARDS
        // ===============================

        document.getElementById("totalLeads").innerText =
            leads.length;

        document.getElementById("newLeads").innerText =
            leads.filter(lead => lead.status === "New").length;

        document.getElementById("contactedLeads").innerText =
            leads.filter(lead => lead.status === "Contacted").length;

        document.getElementById("interestedLeads").innerText =
            leads.filter(lead => lead.status === "Interested").length;

        document.getElementById("followUpLeads").innerText =
            leads.filter(lead => lead.status === "Follow-up").length;

        document.getElementById("convertedLeads").innerText =
            leads.filter(lead => lead.status === "Converted").length;

        document.getElementById("lostLeads").innerText =
            leads.filter(lead => lead.status === "Lost").length;


    } catch (error) {

        console.error("Dashboard Lead Stats Error:", error);

    }

}
// ===============================
// DASHBOARD YEAR / MONTH FILTER
// ===============================

const dashboardYearFilter =
    document.getElementById("dashboardYear");

const dashboardMonthFilter =
    document.getElementById("dashboardMonth");

if (dashboardYearFilter && dashboardMonthFilter) {

    dashboardYearFilter.addEventListener("change", function () {
        loadDashboardLeadStats();
    });

    dashboardMonthFilter.addEventListener("change", function () {
        loadDashboardLeadStats();
    });

}
// ===============================
// DASHBOARD CRM STATS
// ===============================

const totalCustomers = document.getElementById("totalCustomers");

if (totalCustomers) {
    loadCRMStats();
}

async function loadCRMStats() {

    try {

        const [customersResponse, ordersResponse] = await Promise.all([
            apiFetch("/api/customers"),
            apiFetch("/api/orders")
        ]);

        const customersData = await customersResponse.json();
        const ordersData = await ordersResponse.json();

        const customers = customersData.customers || [];
        const orders = ordersData.orders || [];

        // Total Customers
        document.getElementById("totalCustomers").innerText =
            customers.length;

        // Total Orders
        document.getElementById("totalOrders").innerText =
            orders.length;

        // Total Sales = amount actually received (including partial payments)
        const totalSales = orders.reduce(
            (sum, order) => sum + Number(order.amountPaid || 0),
            0
        );

        document.getElementById("totalSales").innerText =
            "₹" + totalSales.toLocaleString("en-IN");

        // Pending Payments = remaining balance
        const pendingPayments = orders.reduce(
            (sum, order) =>
                sum + Math.max(
                    0,
                    Number(order.totalAmount || 0) - Number(order.amountPaid || 0)
                ),
            0
        );

        document.getElementById("pendingPayments").innerText =
            "₹" + pendingPayments.toLocaleString("en-IN");

    } catch (error) {

        console.error("CRM Stats Error:", error);

    }

}
/* ==========================================
   BUSINESS ANALYTICS
   YEARLY + MONTHLY + DATE-WISE
========================================== */

let businessChart = null;

let analyticsLeads = [];
let analyticsOrders = [];


/* ==========================================
   LOAD ANALYTICS DATA
========================================== */

async function loadBusinessAnalytics() {

    try {

        const token =
            localStorage.getItem("crmToken");


        const [leadsResponse, ordersResponse] =
            await Promise.all([

                fetch("/api/leads", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }),

                apiFetch("/api/orders")

            ]);


        const leadsData =
            await leadsResponse.json();

        const ordersData =
            await ordersResponse.json();


        if (!leadsData.success) {

            console.error(
                "Leads loading failed:",
                leadsData.message
            );

            return;
        }


        analyticsLeads =
            leadsData.leads || [];

        analyticsOrders =
            ordersData.orders || [];


        updateBusinessAnalytics();


    } catch (error) {

        console.error(
            "Business Analytics Error:",
            error
        );

    }

}


/* ==========================================
   UPDATE ANALYTICS
========================================== */

function updateBusinessAnalytics() {

    const yearSelect =
        document.getElementById(
            "dashboardYear"
        );

    const monthSelect =
        document.getElementById(
            "dashboardMonth"
        );


    if (!yearSelect || !monthSelect) {
        return;
    }


    const selectedYear =
        Number(yearSelect.value);


    const selectedMonth =
        monthSelect.value;


    const isAllMonths =
        selectedMonth === "" ||
        selectedMonth === "all";


    /* ==========================================
       FILTER LEADS
    ========================================== */

    const filteredLeads =
        analyticsLeads.filter(lead => {

            const date =
                new Date(lead.createdAt);


            if (
                date.getFullYear() !==
                selectedYear
            ) {

                return false;
            }


            if (
                !isAllMonths &&
                date.getMonth() !==
                Number(selectedMonth)
            ) {

                return false;
            }


            return true;

        });


    /* ==========================================
       FILTER ORDERS
    ========================================== */

    const filteredOrders =
        analyticsOrders.filter(order => {

            const date =
                new Date(
                    order.orderDate ||
                    order.createdAt
                );


            if (
                date.getFullYear() !==
                selectedYear
            ) {

                return false;
            }


            if (
                !isAllMonths &&
                date.getMonth() !==
                Number(selectedMonth)
            ) {

                return false;
            }


            return true;

        });


    /* ==========================================
       TOTAL LEADS
    ========================================== */

    const totalLeads =
        filteredLeads.length;


    /* ==========================================
       TOTAL SALES
    ========================================== */

    const totalSales =
        filteredOrders.reduce(
            (sum, order) => sum + Number(order.amountPaid || 0),
            0
        );


    /* ==========================================
       UPDATE SUMMARY
    ========================================== */

    const graphTotalLeads =
        document.getElementById(
            "graphTotalLeads"
        );


    const graphTotalSales =
        document.getElementById(
            "graphTotalSales"
        );


    if (graphTotalLeads) {

        graphTotalLeads.innerText =
            totalLeads;

    }


    if (graphTotalSales) {

        graphTotalSales.innerText =
            "₹" +
            totalSales.toLocaleString(
                "en-IN"
            );

    }


    /* ==========================================
       PERIOD TEXT
    ========================================== */

    const analyticsPeriod =
        document.getElementById(
            "analyticsPeriod"
        );


    const monthNames = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    if (analyticsPeriod) {

        if (isAllMonths) {

            analyticsPeriod.innerText =
                `${selectedYear} — Yearly Performance`;

        } else {

            analyticsPeriod.innerText =
                `${monthNames[Number(selectedMonth)]} ${selectedYear} — Daily Performance`;

        }

    }


    /* ==========================================
       YEARLY GRAPH
       JANUARY → DECEMBER
    ========================================== */

    if (isAllMonths) {

        createYearlyAnalytics(
            selectedYear,
            filteredLeads,
            filteredOrders
        );

    }


    /* ==========================================
       MONTHLY DATE-WISE GRAPH
       1 → 28/29/30/31
    ========================================== */

    else {

        createDailyAnalytics(
            selectedYear,
            Number(selectedMonth),
            filteredLeads,
            filteredOrders
        );

    }

}


/* ==========================================
   YEARLY ANALYTICS
   JAN → DEC
========================================== */

function createYearlyAnalytics(
    year,
    leads,
    orders
) {

    const labels = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];


    const leadsData =
        new Array(12).fill(0);


    const salesData =
        new Array(12).fill(0);


    /* ==========================================
       COUNT LEADS MONTH-WISE
    ========================================== */

    leads.forEach(lead => {

        const date =
            new Date(
                lead.createdAt
            );


        const month =
            date.getMonth();


        leadsData[month]++;

    });


    /* ==========================================
       COUNT SALES MONTH-WISE
    ========================================== */

    orders

        .filter(order => Number(order.amountPaid || 0) > 0)

        .forEach(order => {

            const date =
                new Date(
                    order.orderDate ||
                    order.createdAt
                );


            const month =
                date.getMonth();


            salesData[month] +=
                Number(
                    order.amountPaid || 0
                );

        });


    createBusinessChart(
        labels,
        leadsData,
        salesData,
        "yearly"
    );

}


/* ==========================================
   DAILY ANALYTICS
   SELECTED MONTH
========================================== */

function createDailyAnalytics(
    year,
    month,
    leads,
    orders
) {

    /*
       JavaScript month:
       January = 0
       February = 1
       ...
       December = 11
    */


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const labels = [];

    const leadsData =
        new Array(daysInMonth).fill(0);


    const salesData =
        new Array(daysInMonth).fill(0);


    /* ==========================================
       CREATE DATE LABELS
       1, 2, 3 ... 31
    ========================================== */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        labels.push(
            String(day)
        );

    }


    /* ==========================================
       DATE-WISE LEADS
    ========================================== */

    leads.forEach(lead => {

        const date =
            new Date(
                lead.createdAt
            );


        const day =
            date.getDate();


        if (
            date.getFullYear() === year &&
            date.getMonth() === month
        ) {

            leadsData[day - 1]++;

        }

    });


    /* ==========================================
       DATE-WISE SALES
    ========================================== */

    orders

        .filter(order => Number(order.amountPaid || 0) > 0)

        .forEach(order => {

            const date =
                new Date(
                    order.orderDate ||
                    order.createdAt
                );


            const day =
                date.getDate();


            if (
                date.getFullYear() === year &&
                date.getMonth() === month
            ) {

                salesData[day - 1] +=
                    Number(
                        order.amountPaid || 0
                    );

            }

        });


    createBusinessChart(
        labels,
        leadsData,
        salesData,
        "daily"
    );

}


/* ==========================================
   CREATE GRAPH
========================================== */

function createBusinessChart(
    labels,
    leadsData,
    salesData,
    mode
) {

    const canvas =
        document.getElementById(
            "businessAnalyticsChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    /* Destroy previous chart */

    if (businessChart) {

        businessChart.destroy();

    }


    businessChart =
        new Chart(ctx, {

            type: "line",


            data: {

                labels: labels,


                datasets: [

                    {
                        label: "Leads",

                        data: leadsData,

                        borderWidth: 3,

                        tension: 0.35,

                        pointRadius: 4,

                        pointHoverRadius: 7,

                        fill: false

                    },


                    {
                        label: "Sales",

                        data: salesData,

                        borderWidth: 3,

                        tension: 0.35,

                        pointRadius: 4,

                        pointHoverRadius: 7,

                        fill: false,

                        yAxisID:
                            "salesAxis"

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                interaction: {

                    mode: "index",

                    intersect: false

                },


                plugins: {

                    legend: {

                        display: true,

                        position: "top"

                    },


                    tooltip: {

                        enabled: true,


                        callbacks: {

                            title:
                                function(context) {

                                    if (
                                        mode ===
                                        "daily"
                                    ) {

                                        return (
                                            "Date: " +
                                            context[0]
                                                .label
                                        );

                                    }


                                    return (
                                        "Month: " +
                                        context[0]
                                            .label
                                    );

                                },


                            label:
                                function(context) {

                                    if (
                                        context.dataset
                                            .label ===
                                        "Sales"
                                    ) {

                                        return (
                                            " Sales: ₹" +
                                            Number(
                                                context.raw ||
                                                0
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                        );

                                    }


                                    return (
                                        " Leads: " +
                                        context.raw
                                    );

                                }

                        }

                    }

                },


                scales: {

                    x: {

                        title: {

                            display: true,

                            text:
                                mode === "daily"
                                    ? "Date"
                                    : "Month"

                        }

                    },


                    y: {

                        beginAtZero: true,

                        title: {

                            display: true,

                            text: "Leads"

                        }

                    },


                    salesAxis: {

                        beginAtZero: true,

                        position: "right",


                        grid: {

                            drawOnChartArea:
                                false

                        },


                        title: {

                            display: true,

                            text: "Sales (₹)"

                        }

                    }

                }

            }

        });

}


/* ==========================================
   YEAR FILTER
========================================== */

const dashboardYear =
    document.getElementById(
        "dashboardYear"
    );


if (dashboardYear) {

    dashboardYear.addEventListener(
        "change",
        updateBusinessAnalytics
    );

}


/* ==========================================
   MONTH FILTER
========================================== */

const dashboardMonth =
    document.getElementById(
        "dashboardMonth"
    );


if (dashboardMonth) {

    dashboardMonth.addEventListener(
        "change",
        updateBusinessAnalytics
    );

}


/* ==========================================
   START ANALYTICS
========================================== */

const analyticsChart =
    document.getElementById(
        "businessAnalyticsChart"
    );


if (analyticsChart) {

    loadBusinessAnalytics();

}

















// ==========================================
// ENHANCED DASHBOARD
// ==========================================

async function loadEnhancedDashboard() {
    const dashboardRoot = document.getElementById("totalLeads");
    if (!dashboardRoot) return;

    const token = localStorage.getItem("crmToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const year = document.getElementById("dashboardYear")?.value || new Date().getFullYear();
    const month = document.getElementById("dashboardMonth")?.value ?? "all";

    try {
        const response = await apiFetch(`/api/dashboard?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`);
        const data = await response.json();
        if (!data.success) return;

        const s = data.stats;
        const values = {
            totalLeads: s.totalLeads,
            newLeads: s.newLeads,
            contactedLeads: s.contactedLeads,
            interestedLeads: s.interestedLeads,
            followUpLeads: s.followUpLeads,
            convertedLeads: s.convertedLeads,
            lostLeads: s.lostLeads,
            totalCustomers: s.totalCustomers,
            totalOrders: s.totalOrders,
            totalSales: "₹" + Number(s.totalSales || 0).toLocaleString("en-IN"),
            pendingPayments: "₹" + Number(s.pendingPayments || 0).toLocaleString("en-IN")
        };

        Object.entries(values).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });

        const followUpBox = document.getElementById("dashboardFollowUps");
        if (followUpBox) {
            if (!data.followUps.length) {
                followUpBox.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><h3>No upcoming follow-ups</h3><p>No follow-ups are due in the next 14 days.</p></div>`;
            } else {
                followUpBox.innerHTML = data.followUps.map(lead => {
                    const d = new Date(lead.followUpDate);
                    const overdue = d < new Date(new Date().setHours(0,0,0,0));
                    return `<div class="followup-row ${overdue ? "overdue" : ""}">
                        <div><strong>${lead.name}</strong><span>${lead.phone} • ${lead.product || "No product"}</span></div>
                        <div><strong>${d.toLocaleDateString("en-IN", {day:"2-digit", month:"short"})}</strong><span>${overdue ? "Overdue" : lead.status}</span></div>
                    </div>`;
                }).join("");
            }
        }

        const staffBox = document.getElementById("dashboardStaffPerformance");
        if (staffBox) {
            if (data.staffPerformance.length) {
                staffBox.innerHTML = `<div class="staff-performance-list">${data.staffPerformance.map(staff => `
                    <div class="staff-performance-row">
                        <div><strong>${staff.name}</strong><span>${staff.leads} leads • ${staff.converted} converted • ${staff.followUps} follow-ups</span></div>
                        <strong>₹${Number(staff.sales || 0).toLocaleString("en-IN")}</strong>
                    </div>`).join("")}</div>`;
            } else if (JSON.parse(localStorage.getItem("crmUser") || "{}")?.role === "admin") {
                staffBox.innerHTML = `<div class="empty-state"><div class="empty-icon">👨‍💼</div><h3>No staff members yet</h3><p>Create staff accounts to start tracking team performance.</p></div>`;
            } else {
                staffBox.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h3>Your performance</h3><p>Your personal lead and sales activity is shown in the dashboard.</p></div>`;
            }
        }

        const user = JSON.parse(localStorage.getItem("crmUser") || "null");
        if (user) {
            const name = document.querySelector(".staff-box strong");
            const role = document.querySelector(".staff-box small");
            const avatar = document.querySelector(".staff-avatar");
            if (name) name.innerText = user.name || "User";
            if (role) role.innerText = user.role === "admin" ? "Administrator" : "Staff";
            if (avatar) avatar.innerText = (user.name || "U").charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error("Enhanced Dashboard Error:", error);
    }
}

const enhancedDashboardYear = document.getElementById("dashboardYear");
const enhancedDashboardMonth = document.getElementById("dashboardMonth");
if (enhancedDashboardYear) enhancedDashboardYear.addEventListener("change", loadEnhancedDashboard);
if (enhancedDashboardMonth) enhancedDashboardMonth.addEventListener("change", loadEnhancedDashboard);
if (document.getElementById("totalLeads")) loadEnhancedDashboard();

async function loadDetailedStaffPerformance() {
    const select = document.getElementById("performanceStaffSelect");
    const box = document.getElementById("staffPerformanceDetail");
    if (!select || !box) return;
    const user = JSON.parse(localStorage.getItem("crmUser") || "null");
    const staffId = select.value || (user?.role === "staff" ? user.id : "");
    if (!staffId) { box.innerHTML = "<p>Select a staff member to view detailed performance.</p>"; return; }
    const year = document.getElementById("dashboardYear")?.value || new Date().getFullYear();
    const month = document.getElementById("dashboardMonth")?.value ?? "all";
    try {
        const r = await apiFetch(`/api/dashboard/performance?staffId=${encodeURIComponent(staffId)}&year=${year}&month=${month}`);
        const d = await r.json();
        if (!d.success) { box.innerHTML = `<p>${d.message || "Unable to load performance"}</p>`; return; }
        const x=d.summary;
        box.innerHTML = `<div class="staff-performance-list"><div class="staff-performance-row"><div><strong>${d.staff.name}</strong><span>${x.customers} customers • ${x.leads} leads • ${x.converted} converted • ${x.orders} orders</span></div><strong>₹${Number(x.sales).toLocaleString("en-IN")}</strong></div></div>
        <div class="orders-summary" style="margin-top:12px;grid-template-columns:repeat(5,1fr)">
          <div class="stat-card"><h3>Customers</h3><strong>${x.customers}</strong></div><div class="stat-card"><h3>Leads</h3><strong>${x.leads}</strong></div><div class="stat-card"><h3>Orders</h3><strong>${x.orders}</strong></div><div class="stat-card"><h3>Sale Received</h3><strong>₹${Number(x.sales).toLocaleString("en-IN")}</strong></div><div class="stat-card"><h3>Pending</h3><strong>₹${Number(x.pending).toLocaleString("en-IN")}</strong></div>
        </div>
        <div class="table-container" style="margin-top:12px"><table><thead><tr><th>Period</th><th>Leads</th><th>Orders</th><th>Sale Received</th><th>Pending</th></tr></thead><tbody>${d.timeline.length ? d.timeline.map(b=>`<tr><td>${b.period}</td><td>${b.leads}</td><td>${b.orders}</td><td>₹${Number(b.sales).toLocaleString("en-IN")}</td><td>₹${Number(b.pending).toLocaleString("en-IN")}</td></tr>`).join("") : `<tr><td colspan="5">No activity for this period.</td></tr>`}</tbody></table></div>
        <div class="table-container" style="margin-top:12px"><table><thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Total</th><th>Received</th><th>Pending</th></tr></thead><tbody>${d.orders.length ? d.orders.map(o=>`<tr><td>${new Date(o.orderDate).toLocaleDateString("en-IN")}</td><td>${o.customer?.name || "-"}</td><td>${o.product || "-"}</td><td>₹${Number(o.totalAmount||0).toLocaleString("en-IN")}</td><td>₹${Number(o.amountPaid||0).toLocaleString("en-IN")}</td><td>₹${Math.max(0,Number(o.totalAmount||0)-Number(o.amountPaid||0)).toLocaleString("en-IN")}</td></tr>`).join("") : `<tr><td colspan="6">No sales/orders for this period.</td></tr>`}</tbody></table></div>`;
    } catch(e) { console.error(e); box.innerHTML="<p>Server error.</p>"; }
}

async function setupPerformanceSelector() {
    const select=document.getElementById("performanceStaffSelect"); if(!select) return;
    const user=JSON.parse(localStorage.getItem("crmUser")||"null");
    if(user?.role !== "admin") { select.innerHTML=`<option value="${user?.id || ""}">${user?.name || "My Performance"}</option>`; return; }
    const r=await apiFetch("/api/users/staff"); const d=await r.json(); if(!d.success)return;
    select.innerHTML='<option value="">Select staff</option>'+d.users.map(u=>`<option value="${u._id}">${u.name}</option>`).join("");
}
setupPerformanceSelector();
document.getElementById("loadStaffPerformance")?.addEventListener("click", loadDetailedStaffPerformance);



// ===============================
// PHASE 3 - PAYMENT CENTER
// ===============================

async function loadPaymentCenter() {
    const table = document.getElementById("paymentCenterTable");
    if (!table) return;
    try {
        const response = await apiFetch("/api/orders");
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Unable to load orders");
        const orders = data.orders || [];
        const total = orders.reduce((sum,o)=>sum+Number(o.totalAmount||0),0);
        const sale = orders.reduce((sum,o)=>sum+Number(o.amountPaid||0),0);
        const pending = Math.max(0,total-sale);
        const el=id=>document.getElementById(id);
        if(el("paymentTotal")) el("paymentTotal").innerText="₹"+total.toLocaleString("en-IN");
        if(el("paymentReceived")) el("paymentReceived").innerText="₹"+sale.toLocaleString("en-IN");
        if(el("paymentPending")) el("paymentPending").innerText="₹"+pending.toLocaleString("en-IN");
        const filtered=orders.filter(o=>Number(o.remainingAmount||0)>0);
        table.innerHTML=filtered.length?filtered.map(o=>`<tr><td>${o.customer?.name||"-"}</td><td>${o.customer?.phone||"-"}</td><td>${o.product||"-"}</td><td>₹${Number(o.totalAmount||0).toLocaleString("en-IN")}</td><td>₹${Number(o.amountPaid||0).toLocaleString("en-IN")}</td><td>₹${Number(o.remainingAmount||0).toLocaleString("en-IN")}</td><td>${o.paymentStatus||"Pending"}</td></tr>`).join(""):"<tr><td colspan='7'>No pending payments</td></tr>";
    } catch(error) { console.error("Payment Center Error:",error); table.innerHTML="<tr><td colspan='7'>Unable to load collection data</td></tr>"; }
}

if (document.getElementById("paymentCenterTable")) {
    loadPaymentCenter();
}

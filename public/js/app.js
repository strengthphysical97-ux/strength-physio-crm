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
            notes: document.getElementById("notes").value
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

        const response = await fetch("/api/users", {
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
                lead.createdBy &&
                lead.createdBy._id === selectedStaff
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
        lead.createdBy
            ? lead.createdBy.name
            : "Unassigned"
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
                        document.getElementById("notes").value

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

        const response = await fetch("/api/customers");

        const data = await response.json();

        if (!data.success) {

            customersTable.innerHTML =
                "<tr><td colspan='6'>Unable to load customers</td></tr>";

            return;
        }

        displayCustomers(data.customers);

    } catch (error) {

        console.error(error);

        customersTable.innerHTML =
            "<tr><td colspan='6'>Server error</td></tr>";

    }

}


// ===============================
// DISPLAY CUSTOMERS
// ===============================

function displayCustomers(customers) {

    if (customers.length === 0) {

        customersTable.innerHTML =
            "<tr><td colspan='6'>No customers found</td></tr>";

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

            notes: document.getElementById("notes").value

        };

        try {

            const response = await fetch("/api/customers", {

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

        const response = await fetch(`/api/customers/${id}`, {
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

        const response = await fetch("/api/customers");

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

        const response = await fetch("/api/customers");

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
// ===============================
// ADD NEW ORDER
// ===============================

const orderForm = document.getElementById("orderForm");

if (orderForm) {

    orderForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const orderData = {

            customer: document.getElementById("customer").value,

            product: document.getElementById("product").value,

            quantity: Number(
                document.getElementById("quantity").value
            ),

            price: Number(
                document.getElementById("price").value
            ),

            totalAmount: Number(
                document.getElementById("totalAmount").value
            ),

            paymentStatus:
                document.getElementById("paymentStatus").value,

            orderStatus:
                document.getElementById("orderStatus").value,

            orderDate:
                document.getElementById("orderDate").value || undefined,

            notes:
                document.getElementById("notes").value

        };

        try {

            const response = await fetch("/api/orders", {

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

if (ordersTable) {
    loadOrders();
}

async function loadOrders() {

    try {

        const response = await fetch("/api/orders");

        const data = await response.json();

        if (!data.success) {

            ordersTable.innerHTML =
                "<tr><td colspan='10'>Unable to load orders</td></tr>";

            return;
        }

        displayOrders(data.orders);

    } catch (error) {

        console.error(error);

        ordersTable.innerHTML =
            "<tr><td colspan='10'>Server error</td></tr>";

    }

}


// ===============================
// DISPLAY ORDERS
// ===============================

function displayOrders(orders) {

    if (orders.length === 0) {

        ordersTable.innerHTML =
            "<tr><td colspan='10'>No orders found</td></tr>";

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

            <td>₹${order.totalAmount}</td>

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

        const response = await fetch(`/api/orders/${id}`, {
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

                totalAmount: Number(
                    document.getElementById("totalAmount").value
                ),

                paymentStatus:
                    document.getElementById("paymentStatus").value,

                orderStatus:
                    document.getElementById("orderStatus").value,

                orderDate:
                    document.getElementById("orderDate").value,

                notes:
                    document.getElementById("notes").value

            };

            try {

                const response = await fetch(
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
                fetch("/api/orders"),
                fetch("/api/customers")
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

        document.getElementById("totalAmount").value =
            order.totalAmount || 0;

        document.getElementById("paymentStatus").value =
            order.paymentStatus || "Pending";

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
            fetch("/api/customers"),
            fetch("/api/orders")
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

        // Total Sales
        const totalSales = orders
            .filter(order => order.paymentStatus === "Paid")
            .reduce(
                (sum, order) => sum + Number(order.totalAmount || 0),
                0
            );

        document.getElementById("totalSales").innerText =
            "₹" + totalSales.toLocaleString("en-IN");

        // Pending Payments
        const pendingPayments = orders
            .filter(order => order.paymentStatus !== "Paid")
            .reduce(
                (sum, order) => sum + Number(order.totalAmount || 0),
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

                fetch("/api/orders")

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
        filteredOrders

            .filter(order =>
                order.paymentStatus === "Paid"
            )

            .reduce(
                (sum, order) => {

                    return (
                        sum +
                        Number(
                            order.totalAmount || 0
                        )
                    );

                },
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

        .filter(order =>
            order.paymentStatus === "Paid"
        )

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
                    order.totalAmount || 0
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

        .filter(order =>
            order.paymentStatus === "Paid"
        )

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
                        order.totalAmount || 0
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
















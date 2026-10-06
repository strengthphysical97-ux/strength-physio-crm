// ==========================================
// STAFF MANAGEMENT
// ==========================================

const staffForm = document.getElementById("staffForm");
const staffTable = document.getElementById("staffTable");
const staffMessage = document.getElementById("staffMessage");
const staffCount = document.getElementById("staffCount");


// ==========================================
// LOAD STAFF
// ==========================================

async function loadStaff() {

    try {

        const token = localStorage.getItem("crmToken");

        const response = await fetch("/api/users", {

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });


        const data = await response.json();


        if (!data.success) {

            staffTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        ${data.message || "Failed to load staff"}
                    </td>
                </tr>
            `;

            return;
        }


        const users = data.users || [];


        staffCount.innerText =
            `${users.length} Member${users.length !== 1 ? "s" : ""}`;


        if (users.length === 0) {

            staffTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        No staff members found
                    </td>
                </tr>
            `;

            return;
        }


        staffTable.innerHTML = users.map(user => {

            const joinedDate =
                new Date(user.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );


            return `

                <tr>

                    <td>
                        <strong>
                            ${user.name}
                        </strong>
                    </td>


                    <td>
                        ${user.email}
                    </td>


                    <td>

                        <span class="role-badge ${user.role}">
                            ${user.role}
                        </span>

                    </td>


                    <td>
                        ${joinedDate}
                    </td>


                    <td>

                        <button
                            class="delete-staff-btn"
                            onclick="deleteStaff('${user._id}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");


    } catch (error) {

        console.error(
            "Staff Load Error:",
            error
        );


        staffTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Server error. Please try again.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// CREATE STAFF
// ==========================================

staffForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const name =
            document
                .getElementById("staffName")
                .value
                .trim();


        const email =
            document
                .getElementById("staffEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("staffPassword")
                .value;


        const role =
            document
                .getElementById("staffRole")
                .value;


        if (!name || !email || !password) {

            staffMessage.innerText =
                "Please fill all required fields.";

            return;

        }


        try {

            const token =
                localStorage.getItem("crmToken");


            const response =
                await fetch("/api/users", {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        name: name,

                        email: email,

                        password: password,

                        role: role

                    })

                });


            const data =
                await response.json();


            if (!data.success) {

                staffMessage.innerText =
                    data.message ||
                    "Failed to create staff.";

                return;

            }


            staffMessage.innerText =
                "Staff created successfully!";


            staffForm.reset();


            loadStaff();


        } catch (error) {

            console.error(
                "Create Staff Error:",
                error
            );


            staffMessage.innerText =
                "Server error. Please try again.";

        }

    }
);


// ==========================================
// DELETE STAFF
// ==========================================

async function deleteStaff(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this user?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const token =
            localStorage.getItem("crmToken");


        const response =
            await fetch(
                `/api/users/${id}`,
                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to delete user."
            );

            return;

        }


        alert(
            "User deleted successfully."
        );


        loadStaff();


    } catch (error) {

        console.error(
            "Delete Staff Error:",
            error
        );


        alert(
            "Server error. Please try again."
        );

    }

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadStaff();
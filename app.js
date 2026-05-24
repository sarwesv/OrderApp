// --- Application Logic & State ---

// Retrieve stored orders from localStorage, or initialize an empty array if none exist
let orders = JSON.parse(localStorage.getItem('businessOrders')) || [];

// UI State for Filtering and Sorting
let filterText = '';
let filterStatus = 'All';
let filterItem = 'All';
let sortConfig = { key: null, direction: 'asc' }; // direction: 'asc' or 'desc'
let recentlyUpdatedIndex = null;

const orderForm = document.getElementById('orderForm');
const orderTableBody = document.getElementById('orderTableBody');
const searchInput = document.getElementById('searchInput');
const filterStatusSelect = document.getElementById('filterStatus');
const filterItemSelect = document.getElementById('filterItem');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const tableHeaders = document.querySelectorAll('#orderTable th[data-sort]');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeBtn = document.querySelector('.close-btn');

// Export/Import Elements
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');

// --- Functions ---

function saveToStorage() {
    localStorage.setItem('businessOrders', JSON.stringify(orders));
}

function generateRandomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Update the Item Filter dropdown with unique items from current orders
function updateItemDropdown() {
    const currentSelection = filterItem;
    const uniqueItems = [...new Set(orders.map(o => o.item))].sort();
    
    // Clear and reset
    filterItemSelect.innerHTML = '<option value="All">All Items</option>';
    
    uniqueItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        filterItemSelect.appendChild(option);
    });

    // Restore selection if it still exists
    if (uniqueItems.includes(currentSelection)) {
        filterItemSelect.value = currentSelection;
    } else {
        filterItem = 'All';
    }
}

// Function to render orders list into the HTML Table with Filtering and Sorting
function renderOrders() {
    updateItemDropdown();

    // 1. Filter the orders
    let processedOrders = orders.map((order, originalIndex) => ({ ...order, originalIndex }));

    if (filterText) {
        const lowerText = filterText.toLowerCase();
        processedOrders = processedOrders.filter(order => 
            order.customer.toLowerCase().includes(lowerText) || 
            order.item.toLowerCase().includes(lowerText) ||
            (order.id && order.id.toLowerCase().includes(lowerText))
        );
    }

    if (filterStatus !== 'All') {
        processedOrders = processedOrders.filter(order => order.status === filterStatus);
    }

    if (filterItem !== 'All') {
        processedOrders = processedOrders.filter(order => order.item === filterItem);
    }

    // 2. Sort the orders
    if (sortConfig.key) {
        processedOrders.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Handle numeric sorting for qty
            if (sortConfig.key === 'qty') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // 3. Render the table
    orderTableBody.innerHTML = '';

    if (processedOrders.length === 0) {
        orderTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No matching orders found.</td></tr>`;
        return;
    }

    processedOrders.forEach((order) => {
        const row = document.createElement('tr');
        row.classList.add('order-row');
        row.setAttribute('data-index', order.originalIndex);

        if (recentlyUpdatedIndex === order.originalIndex) {
            row.classList.add('flash-update');
        }

        const statusClass = order.status.toLowerCase() === 'completed' ? 'completed' : 'pending';
        const displayId = order.id || (1001 + order.originalIndex);

        row.innerHTML = `
            <td>#${displayId}</td>
            <td><strong>${escapeHtml(order.customer)}</strong></td>
            <td>${escapeHtml(order.item)}</td>
            <td>${order.qty}</td>
            <td><span class="badge ${statusClass}">${order.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn toggle-btn" onclick="toggleStatus(${order.originalIndex})">Status</button>
                <button class="action-btn edit-btn" onclick="openEditModal(${order.originalIndex})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteOrder(${order.originalIndex})">Delete</button>
            </td>
        `;
        orderTableBody.appendChild(row);
    });

    recentlyUpdatedIndex = null;
    updateHeaderStyles();
}

function updateHeaderStyles() {
    tableHeaders.forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === sortConfig.key) {
            th.classList.add(sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// --- Event Listeners ---

// Form Submission: Add Order
orderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const newOrder = {
        id: generateRandomId(),
        customer: document.getElementById('customerName').value,
        item: document.getElementById('itemDescription').value,
        qty: parseInt(document.getElementById('quantity').value),
        status: document.getElementById('status').value
    };
    orders.push(newOrder);
    saveToStorage();
    renderOrders();
    orderForm.reset();
});

// Search and Filter Listeners
searchInput.addEventListener('input', (e) => {
    filterText = e.target.value;
    renderOrders();
});

filterStatusSelect.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderOrders();
});

filterItemSelect.addEventListener('change', (e) => {
    filterItem = e.target.value;
    renderOrders();
});

resetFiltersBtn.addEventListener('click', () => {
    filterText = '';
    filterStatus = 'All';
    filterItem = 'All';
    
    searchInput.value = '';
    filterStatusSelect.value = 'All';
    filterItemSelect.value = 'All';
    
    renderOrders();
});

// Sorting Listeners
tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortConfig.key === key) {
            sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            sortConfig.key = key;
            sortConfig.direction = 'asc';
        }
        renderOrders();
    });
});

// --- Actions ---

window.toggleStatus = function(index) {
    orders[index].status = orders[index].status === 'Pending' ? 'Completed' : 'Pending';
    recentlyUpdatedIndex = index;
    saveToStorage();
    renderOrders();
};

window.deleteOrder = function(index) {
    const rowElement = document.querySelector(`tr[data-index="${index}"]`);
    if (rowElement) {
        rowElement.classList.add('leave');
        setTimeout(() => {
            orders.splice(index, 1);
            saveToStorage();
            renderOrders();
        }, 300);
    } else {
        orders.splice(index, 1);
        saveToStorage();
        renderOrders();
    }
};

// --- Edit Modal Logic ---

window.openEditModal = function(index) {
    const order = orders[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('editCustomerName').value = order.customer;
    document.getElementById('editItemDescription').value = order.item;
    document.getElementById('editQuantity').value = order.qty;
    document.getElementById('editStatus').value = order.status;
    editModal.style.display = 'block';
};

closeBtn.onclick = () => editModal.style.display = 'none';
window.onclick = (e) => { if (e.target === editModal) editModal.style.display = 'none'; };

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = document.getElementById('editIndex').value;
    orders[index] = {
        ...orders[index],
        customer: document.getElementById('editCustomerName').value,
        item: document.getElementById('editItemDescription').value,
        qty: parseInt(document.getElementById('editQuantity').value),
        status: document.getElementById('editStatus').value
    };
    recentlyUpdatedIndex = parseInt(index);
    saveToStorage();
    editModal.style.display = 'none';
    renderOrders();
});

// --- Export / Import Logic ---

exportBtn.onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "orders_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

importBtn.onclick = () => importInput.click();

importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedOrders = JSON.parse(event.target.result);
            if (Array.isArray(importedOrders)) {
                if (confirm('Replace current orders with imported data?')) {
                    orders = importedOrders;
                    saveToStorage();
                    renderOrders();
                }
            } else {
                alert('Invalid file format.');
            }
        } catch (err) {
            alert('Error parsing JSON file.');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
};

// --- Utilities ---

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Startup
renderOrders();
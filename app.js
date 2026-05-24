// Retrieve stored orders from localStorage, or initialize an empty array if none exist
let orders = JSON.parse(localStorage.getItem('businessOrders')) || [];

// Track which row was just updated so we can selectively play the status flash animation
let recentlyUpdatedIndex = null;

const orderForm = document.getElementById('orderForm');
const orderTableBody = document.getElementById('orderTableBody');

function saveToStorage() {
    localStorage.setItem('businessOrders', JSON.stringify(orders));
}

function renderOrders() {
    orderTableBody.innerHTML = '';

    if (orders.length === 0) {
        orderTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No orders available. Add one above!</td></tr>`;
        return;
    }

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.classList.add('order-row');
        row.setAttribute('data-index', index);

        // If this specific row was just updated, append the flash-update animation class
        if (recentlyUpdatedIndex === index) {
            row.classList.add('flash-update');
        }

        const statusClass = order.status.toLowerCase() === 'completed' ? 'completed' : 'pending';

        row.innerHTML = `
            <td>#${1001 + index}</td>
            <td><strong>${escapeHtml(order.customer)}</strong></td>
            <td>${escapeHtml(order.item)}</td>
            <td>${order.qty}</td>
            <td><span class="badge ${statusClass}">${order.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn toggle-btn" onclick="toggleStatus(${index})">Change Status</button>
                <button class="action-btn delete-btn" onclick="deleteOrder(${index})">Delete</button>
            </td>
        `;
        orderTableBody.appendChild(row);
    });

    // Reset the tracker after drawing the screen
    recentlyUpdatedIndex = null;
}

// Event Handler: Add Order
orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const newOrder = {
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

// Action: Toggle Status with a temporary flash effect tracker
window.toggleStatus = function(index) {
    orders[index].status = orders[index].status === 'Pending' ? 'Completed' : 'Pending';
    recentlyUpdatedIndex = index; // Flag this row index for a flash color highlight
    saveToStorage();
    renderOrders();
};

// Action: Delete Order with an animation delay escape loop
window.deleteOrder = function(index) {
    // Find the actual HTML row element matching this index inside the browser DOM
    const rowElement = document.querySelector(`tr[data-index="${index}"]`);
    
    if (rowElement) {
        // Add the CSS exit class (slides right and fades away)
        rowElement.classList.add('leave');
        
        // Wait exactly 300 milliseconds (matching our CSS animation duration) before updating array state
        setTimeout(() => {
            orders.splice(index, 1);
            saveToStorage();
            renderOrders();
        }, 300);
    } else {
        // Fallback safety catch
        orders.splice(index, 1);
        saveToStorage();
        renderOrders();
    }
};

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Startup
renderOrders();
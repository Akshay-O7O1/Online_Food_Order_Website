// My Orders JavaScript

$(document).ready(function() {
    let allOrders = [];
    let filteredOrders = [];
    let currentRating = 0;

    // Initialize page
    function init() {
        loadOrders();
        setupEventListeners();
        filterOrders('all');
    }

    // Load orders from localStorage
    function loadOrders() {
        allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        
        // Add some sample orders if none exist
        if (allOrders.length === 0) {
            allOrders = [
                {
                    orderId: 'AK12345',
                    items: [
                        { name: 'Margherita Pizza', price: 299, quantity: 1 },
                        { name: 'Classic Burger', price: 199, quantity: 1 }
                    ],
                    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    status: 'out_for_delivery',
                    total: 548
                },
                {
                    orderId: 'AK12344',
                    items: [
                        { name: 'Pasta Carbonara', price: 249, quantity: 1 },
                        { name: 'Chocolate Cake', price: 149, quantity: 1 }
                    ],
                    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    status: 'delivered',
                    total: 428
                },
                {
                    orderId: 'AK12343',
                    items: [
                        { name: 'Classic Burger', price: 199, quantity: 1 },
                        { name: 'Pepperoni Pizza', price: 399, quantity: 1 }
                    ],
                    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                    status: 'delivered',
                    total: 598
                }
            ];
            localStorage.setItem('orders', JSON.stringify(allOrders));
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Order filter buttons
        $('input[name="orderFilter"]').change(function() {
            const filterType = $(this).attr('id').replace('-orders', '').replace('all', 'all');
            filterOrders(filterType);
        });

        // Search orders
        $('#search-orders').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            searchOrders(searchTerm);
        });

        // Rating stars
        $('.rating-stars .star').click(function() {
            currentRating = parseInt($(this).data('rating'));
            updateStarDisplay();
        });

        $('.rating-stars .star').hover(function() {
            const hoverRating = parseInt($(this).data('rating'));
            highlightStars(hoverRating);
        });

        $('.rating-stars').mouseleave(function() {
            highlightStars(currentRating);
        });

        // Submit rating
        $('#submit-rating').click(function() {
            submitRating();
        });
    }

    // Filter orders by status
    function filterOrders(filterType) {
        if (filterType === 'all') {
            filteredOrders = allOrders;
        } else if (filterType === 'active') {
            filteredOrders = allOrders.filter(order => 
                ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status)
            );
        } else if (filterType === 'delivered') {
            filteredOrders = allOrders.filter(order => order.status === 'delivered');
        } else if (filterType === 'cancelled') {
            filteredOrders = allOrders.filter(order => order.status === 'cancelled');
        }

        displayOrders(filteredOrders);
    }

    // Search orders
    function searchOrders(searchTerm) {
        if (!searchTerm) {
            displayOrders(filteredOrders);
            return;
        }

        const searchResults = filteredOrders.filter(order => 
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.items.some(item => item.name.toLowerCase().includes(searchTerm))
        );

        displayOrders(searchResults);
    }

    // Display orders
    function displayOrders(orders) {
        const container = $('#orders-container');
        const orderCards = container.find('.order-card');
        const emptyState = $('#empty-orders');

        if (orders.length === 0) {
            orderCards.hide();
            emptyState.show();
            return;
        }

        emptyState.hide();
        orderCards.hide();

        orders.forEach(order => {
            let orderCard = container.find(`[data-order-id="${order.orderId}"]`);
            
            if (orderCard.length === 0) {
                orderCard = createOrderCard(order);
                container.append(orderCard);
            }
            
            orderCard.show();
        });
    }

    // Create order card HTML
    function createOrderCard(order) {
        const statusMap = {
            'confirmed': { text: 'Order Confirmed', class: 'bg-info', dataStatus: 'active' },
            'preparing': { text: 'Preparing Food', class: 'bg-warning', dataStatus: 'active' },
            'out_for_delivery': { text: 'Out for Delivery', class: 'bg-warning', dataStatus: 'active' },
            'delivered': { text: 'Delivered', class: 'bg-success', dataStatus: 'delivered' },
            'cancelled': { text: 'Cancelled', class: 'bg-danger', dataStatus: 'cancelled' }
        };

        const status = statusMap[order.status] || statusMap['confirmed'];
        const orderDate = new Date(order.orderDate);
        const itemsText = order.items.map(item => item.name).join(', ');
        const firstItemImage = getItemImage(order.items[0].name);

        const actionButtons = status.dataStatus === 'active' ? `
            <button class="btn btn-primary btn-sm mb-1 w-100" onclick="trackOrder('${order.orderId}')">
                <i class="fas fa-map-marker-alt me-1"></i>Track
            </button>
            <button class="btn btn-outline-secondary btn-sm w-100" onclick="viewOrder('${order.orderId}')">
                <i class="fas fa-eye me-1"></i>View
            </button>
        ` : `
            <button class="btn btn-success btn-sm mb-1 w-100" onclick="reorder('${order.orderId}')">
                <i class="fas fa-redo me-1"></i>Reorder
            </button>
            <button class="btn btn-outline-primary btn-sm w-100" onclick="rateOrder('${order.orderId}')">
                <i class="fas fa-star me-1"></i>Rate
            </button>
        `;

        return $(`
            <div class="card shadow mb-3 order-card" data-status="${status.dataStatus}" data-order-id="${order.orderId}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${firstItemImage}" alt="Order" class="img-fluid rounded" style="height: 80px; object-fit: cover;">
                        </div>
                        <div class="col-md-6">
                            <h6 class="mb-1">Order #${order.orderId}</h6>
                            <p class="text-muted mb-1">${itemsText}</p>
                            <small class="text-muted">${status.dataStatus === 'delivered' ? 'Delivered' : 'Placed'} on ${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <h6 class="mb-0">₹${order.total}</h6>
                            <span class="badge ${status.class}">${status.text}</span>
                        </div>
                        <div class="col-md-2 text-end">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    // Get item image based on name
    function getItemImage(itemName) {
        const imageMap = {
            'Margherita Pizza': 'images/pizza-margherita.jpg',
            'Pepperoni Pizza': 'images/pizza-pepperoni.jpg',
            'Classic Burger': 'images/burger-classic.jpg',
            'Pasta Carbonara': 'images/pasta-carbonara.jpg',
            'Pasta Arrabbiata': 'images/pasta-arrabbiata.jpg',
            'Chocolate Cake': 'images/dessert-chocolate.jpg',
            'Tiramisu': 'images/dessert-tiramisu.jpg'
        };

        return imageMap[itemName] || 'https://via.placeholder.com/80x80/007bff/ffffff?text=Food';
    }

    // Update star display
    function updateStarDisplay() {
        highlightStars(currentRating);
    }

    // Highlight stars
    function highlightStars(rating) {
        $('.rating-stars .star').each(function(index) {
            if (index < rating) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    }

    // Submit rating
    function submitRating() {
        if (currentRating === 0) {
            showMessage('Please select a rating.', 'error');
            return;
        }

        const review = $('#review-text').val();
        
        // Here you would typically send the rating to your backend
        showMessage(`Thank you for your ${currentRating}-star rating!`, 'success');
        
        $('#ratingModal').modal('hide');
        currentRating = 0;
        $('#review-text').val('');
        highlightStars(0);
    }

    // Show message
    function showMessage(message, type = 'success') {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
        
        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show custom-alert" role="alert">
                <i class="fas fa-${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(alert);
        setTimeout(() => alert.alert('close'), 3000);
    }

    // Initialize page
    init();
});

// Global functions for button clicks
function trackOrder(orderId) {
    window.location.href = `order-tracking.html?orderId=${orderId}`;
}

function viewOrder(orderId) {
    // You can implement a detailed order view modal here
    alert(`Viewing order ${orderId}`);
}

function reorder(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.orderId === orderId);
    
    if (order) {
        // Add items back to cart
        localStorage.setItem('cart', JSON.stringify(order.items));
        
        // Show success message
        const alert = $(`
            <div class="alert alert-success alert-dismissible fade show custom-alert" role="alert">
                <i class="fas fa-check-circle me-2"></i>Items added to cart! Redirecting to menu...
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(alert);
        
        setTimeout(() => {
            window.location.href = 'index.html#menu';
        }, 2000);
    }
}

function rateOrder(orderId) {
    // Store the order ID for rating
    $('#ratingModal').data('order-id', orderId);
    $('#ratingModal').modal('show');
}
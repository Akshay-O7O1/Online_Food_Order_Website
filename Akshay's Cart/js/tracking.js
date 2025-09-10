// Order Tracking JavaScript

$(document).ready(function() {
    let map;
    let deliveryMarker;
    let customerMarker;
    let directionsService;
    let directionsRenderer;
    let countdownInterval;

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || 'AK12345';

    // Initialize tracking page
    function init() {
        loadOrderDetails();
        initializeMap();
        startCountdown();
        setupEventListeners();
        simulateDeliveryMovement();
    }

    // Load order details
    function loadOrderDetails() {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.orderId === orderId);

        if (order) {
            $('#order-id').text(order.orderId);
            $('#order-date').text(new Date(order.orderDate).toLocaleDateString());
            $('#order-total').text(order.total);
            
            // Load order items
            const orderItemsHTML = order.items.map(item => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">Qty: ${item.quantity}</small>
                    </div>
                    <span>₹${item.price * item.quantity}</span>
                </div>
            `).join('');
            $('#order-items-list').html(orderItemsHTML);

            // Load delivery address
            const address = order.address;
            $('#delivery-address').html(`
                ${address.street}<br>
                ${address.city}, ${address.pincode}<br>
                ${address.landmark ? 'Near ' + address.landmark : ''}
            `);
        }
    }

    // Initialize Google Maps for tracking
    function initializeMap() {
        // Restaurant location (example)
        const restaurantLocation = { lat: 28.6139, lng: 77.2090 };
        // Customer location (example)
        const customerLocation = { lat: 28.6304, lng: 77.2177 };

        map = new google.maps.Map(document.getElementById('tracking-map'), {
            zoom: 14,
            center: restaurantLocation,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        // Delivery person marker
        deliveryMarker = new google.maps.Marker({
            position: restaurantLocation,
            map: map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/motorcyclist.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'Delivery Person'
        });

        // Customer location marker
        customerMarker = new google.maps.Marker({
            position: customerLocation,
            map: map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(30, 30)
            },
            title: 'Your Location'
        });

        // Directions service
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#007bff',
                strokeWeight: 4
            }
        });
        directionsRenderer.setMap(map);

        // Calculate and display route
        calculateRoute(restaurantLocation, customerLocation);
    }

    // Calculate route between locations
    function calculateRoute(start, end) {
        directionsService.route({
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            }
        });
    }

    // Start countdown timer
    function startCountdown() {
        let timeLeft = 15 * 60; // 15 minutes in seconds

        countdownInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            $('#countdown').text(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                $('#countdown').text('00:00');
                updateOrderStatus('delivered');
            }

            timeLeft--;
        }, 1000);
    }

    // Simulate delivery person movement
    function simulateDeliveryMovement() {
        const restaurantLocation = { lat: 28.6139, lng: 77.2090 };
        const customerLocation = { lat: 28.6304, lng: 77.2177 };
        
        let progress = 0;
        const totalSteps = 100;
        const stepInterval = 9000; // 9 seconds per step (15 minutes total)

        const movementInterval = setInterval(() => {
            progress++;
            
            // Calculate intermediate position
            const lat = restaurantLocation.lat + 
                (customerLocation.lat - restaurantLocation.lat) * (progress / totalSteps);
            const lng = restaurantLocation.lng + 
                (customerLocation.lng - restaurantLocation.lng) * (progress / totalSteps);
            
            const newPosition = { lat: lat, lng: lng };
            deliveryMarker.setPosition(newPosition);

            // Update tracking steps based on progress
            if (progress === 25) {
                updateTrackingStep(2, 'completed');
            } else if (progress === 50) {
                updateTrackingStep(3, 'active');
            } else if (progress >= 100) {
                updateTrackingStep(4, 'completed');
                updateOrderStatus('delivered');
                clearInterval(movementInterval);
            }
        }, stepInterval);
    }

    // Update tracking step status
    function updateTrackingStep(stepNumber, status) {
        const step = $(`.tracking-step[data-step="${stepNumber}"]`);
        step.removeClass('active completed').addClass(status);
        
        if (status === 'completed') {
            const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            step.find('small').text(`Completed at ${currentTime}`).removeClass('text-primary text-muted').addClass('text-success');
        }
    }

    // Update order status
    function updateOrderStatus(status) {
        const statusBadge = $('#order-status');
        const statusMap = {
            'confirmed': { text: 'Order Confirmed', class: 'bg-info' },
            'preparing': { text: 'Preparing Food', class: 'bg-warning' },
            'out_for_delivery': { text: 'Out for Delivery', class: 'bg-primary' },
            'delivered': { text: 'Delivered', class: 'bg-success' }
        };

        if (statusMap[status]) {
            statusBadge.text(statusMap[status].text)
                      .removeClass('bg-info bg-warning bg-primary bg-success')
                      .addClass(statusMap[status].class);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Call delivery person
        $('#call-delivery').click(function() {
            // Simulate phone call
            showMessage('Calling Rahul Kumar...', 'info');
            setTimeout(() => {
                showMessage('Call connected! You can now speak with your delivery partner.', 'success');
            }, 2000);
        });

        // Chat with delivery person
        $('#chat-delivery').click(function() {
            $('#chatModal').modal('show');
        });

        // Send chat message
        $('#send-message').click(function() {
            sendChatMessage();
        });

        $('#chat-input').keypress(function(e) {
            if (e.which === 13) {
                sendChatMessage();
            }
        });

        // Reorder button
        $('#reorder-btn').click(function() {
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const order = orders.find(o => o.orderId === orderId);
            
            if (order) {
                // Add items back to cart
                localStorage.setItem('cart', JSON.stringify(order.items));
                showMessage('Items added to cart! Redirecting to menu...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html#menu';
                }, 2000);
            }
        });

        // Help button
        $('#help-btn').click(function() {
            showMessage('Our customer support team will contact you shortly.', 'info');
        });
    }

    // Send chat message
    function sendChatMessage() {
        const message = $('#chat-input').val().trim();
        if (message) {
            // Add customer message
            $('#chat-messages').append(`
                <div class="chat-message customer-message">
                    <strong>You:</strong> ${message}
                </div>
            `);

            $('#chat-input').val('');

            // Simulate delivery person response
            setTimeout(() => {
                const responses = [
                    "Thanks for the message! I'll be there soon.",
                    "I'm just 5 minutes away from your location.",
                    "Got it! I'll call you when I arrive.",
                    "No problem! See you soon."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                $('#chat-messages').append(`
                    <div class="chat-message delivery-message">
                        <strong>Rahul:</strong> ${randomResponse}
                    </div>
                `);

                // Scroll to bottom
                $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
            }, 1000);

            // Scroll to bottom
            $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
        }
    }

    // Show message
    function showMessage(message, type = 'success') {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'info' ? 'alert-info' : 'alert-danger';
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'info' ? 'info-circle' : 'exclamation-circle';
        
        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show custom-alert" role="alert">
                <i class="fas fa-${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(alert);
        setTimeout(() => alert.alert('close'), 3000);
    }

    // Initialize the page
    init();
});
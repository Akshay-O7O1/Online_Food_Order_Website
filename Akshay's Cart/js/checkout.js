// Checkout Page JavaScript

$(document).ready(function() {
    let map;
    let marker;
    let savedAddresses = JSON.parse(localStorage.getItem('savedAddresses')) || [];
    let currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Debug: Log cart data on page load
    console.log('Cart data loaded:', currentCart);
    console.log('LocalStorage cart:', localStorage.getItem('cart'));
    
    // If cart is empty, add some test items for demonstration
    if (currentCart.length === 0) {
        console.log('Cart is empty, adding test items...');
        currentCart = [
            { name: 'Margherita Pizza', price: 299, quantity: 2 },
            { name: 'Chicken Burger', price: 199, quantity: 1 },
            { name: 'Coke', price: 50, quantity: 2 }
        ];
        localStorage.setItem('cart', JSON.stringify(currentCart));
        console.log('Test items added to cart:', currentCart);
    }

    // Initialize checkout page
    function init() {
        console.log('Initializing checkout page...'); // Debug log
        loadOrderSummary();
        loadSavedAddresses();
        initializeMap();
        setupEventListeners();
        
        // Calculate totals after a short delay to ensure DOM is ready
        setTimeout(() => {
            calculateTotals();
        }, 100);
    }

    // Load order summary from cart
    function loadOrderSummary() {
        const orderItemsContainer = $('#order-items');
        
        console.log('Loading order summary, cart:', currentCart); // Debug log
        
        if (!currentCart || currentCart.length === 0) {
            orderItemsContainer.html('<p class="text-muted">No items in cart</p>');
            return;
        }

        const orderHTML = currentCart.map(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            const itemTotal = itemPrice * itemQuantity;
            
            return `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">Qty: ${itemQuantity} × ₹${itemPrice}</small>
                    </div>
                    <span>₹${itemTotal.toFixed(0)}</span>
                </div>
            `;
        }).join('');

        orderItemsContainer.html(orderHTML);
    }

    // Load saved addresses
    function loadSavedAddresses() {
        const addressSelect = $('#savedAddresses');
        addressSelect.empty().append('<option value="">Select a saved address or add new</option>');
        
        savedAddresses.forEach((address, index) => {
            addressSelect.append(`
                <option value="${index}">${address.name} - ${address.address}, ${address.city}</option>
            `);
        });
    }

    // Initialize Google Maps
    function initializeMap() {
        // Default location (New Delhi)
        const defaultLocation = { lat: 28.6139, lng: 77.2090 };
        
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: defaultLocation,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        marker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            draggable: true,
            title: 'Delivery Location'
        });

        // Update address when marker is dragged
        marker.addListener('dragend', function() {
            const position = marker.getPosition();
            reverseGeocode(position.lat(), position.lng());
        });

        // Click on map to set location
        map.addListener('click', function(event) {
            marker.setPosition(event.latLng);
            reverseGeocode(event.latLng.lat(), event.latLng.lng());
        });
    }

    // Reverse geocoding to get address from coordinates
    function reverseGeocode(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: lat, lng: lng };

        geocoder.geocode({ location: latlng }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const addressComponents = results[0].address_components;
                let streetAddress = '';
                let city = '';
                let pincode = '';

                addressComponents.forEach(component => {
                    if (component.types.includes('street_number') || component.types.includes('route')) {
                        streetAddress += component.long_name + ' ';
                    }
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('postal_code')) {
                        pincode = component.long_name;
                    }
                });

                $('#address').val(streetAddress.trim());
                $('#city').val(city);
                $('#pincode').val(pincode);
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Get current location
        $('#getCurrentLocation').click(function() {
            if (navigator.geolocation) {
                $(this).html('<i class="fas fa-spinner fa-spin me-2"></i>Getting Location...');
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const location = { lat: lat, lng: lng };
                        
                        map.setCenter(location);
                        marker.setPosition(location);
                        reverseGeocode(lat, lng);
                        
                        $('#getCurrentLocation').html('<i class="fas fa-map-marker-alt me-2"></i>Use Current Location');
                    },
                    function(error) {
                        alert('Error getting location: ' + error.message);
                        $('#getCurrentLocation').html('<i class="fas fa-map-marker-alt me-2"></i>Use Current Location');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });

        // Save address
        $('#saveAddress').click(function() {
            const addressData = {
                name: $('#firstName').val() + ' ' + $('#lastName').val(),
                address: $('#address').val(),
                city: $('#city').val(),
                pincode: $('#pincode').val(),
                landmark: $('#landmark').val()
            };

            if (addressData.address && addressData.city && addressData.pincode) {
                savedAddresses.push(addressData);
                localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
                loadSavedAddresses();
                showMessage('Address saved successfully!');
            } else {
                showMessage('Please fill in all required address fields.', 'error');
            }
        });

        // Load saved address
        $('#savedAddresses').change(function() {
            const selectedIndex = $(this).val();
            if (selectedIndex !== '') {
                const address = savedAddresses[selectedIndex];
                $('#address').val(address.address);
                $('#city').val(address.city);
                $('#pincode').val(address.pincode);
                $('#landmark').val(address.landmark);
            }
        });

        // Delivery type change
        $('input[name="deliveryType"]').change(function() {
            calculateTotals();
        });

        // Recalculate total (for testing)
        $('#recalculate-total').click(function() {
            console.log('Manual recalculation triggered');
            currentCart = JSON.parse(localStorage.getItem('cart')) || [];
            loadOrderSummary();
            calculateTotals();
        });

        // Place order
        $('#place-order').click(function() {
            if (validateForm()) {
                processOrder();
            }
        });
    }

    // Calculate totals
    function calculateTotals() {
        console.log('Calculating totals...', currentCart); // Debug log
        
        if (!currentCart || currentCart.length === 0) {
            $('#subtotal').text('₹0');
            $('#delivery-fee').text('₹0');
            $('#taxes').text('₹0');
            $('#total-amount').text('₹0');
            return;
        }

        const subtotal = currentCart.reduce((total, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            return total + (itemPrice * itemQuantity);
        }, 0);
        
        const deliveryFee = $('input[name="deliveryType"]:checked').val() === 'express' ? 50 : 0;
        const taxes = Math.round(subtotal * 0.05); // 5% tax
        const total = subtotal + deliveryFee + taxes;

        console.log('Totals calculated:', { subtotal, deliveryFee, taxes, total }); // Debug log

        $('#subtotal').text('₹' + subtotal.toFixed(0));
        $('#delivery-fee').text('₹' + deliveryFee);
        $('#taxes').text('₹' + taxes);
        $('#total-amount').text('₹' + total.toFixed(0));
    }

    // Validate form
    function validateForm() {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'pincode'];
        let isValid = true;

        requiredFields.forEach(field => {
            const value = $('#' + field).val().trim();
            if (!value) {
                $('#' + field).addClass('is-invalid');
                isValid = false;
            } else {
                $('#' + field).removeClass('is-invalid');
            }
        });

        if (!isValid) {
            showMessage('Please fill in all required fields.', 'error');
        }

        return isValid;
    }

    // Process order
    function processOrder() {
        const orderData = {
            orderId: 'AK' + Date.now(),
            items: currentCart,
            customer: {
                firstName: $('#firstName').val(),
                lastName: $('#lastName').val(),
                email: $('#email').val(),
                phone: $('#phone').val()
            },
            address: {
                street: $('#address').val(),
                city: $('#city').val(),
                pincode: $('#pincode').val(),
                landmark: $('#landmark').val()
            },
            deliveryType: $('input[name="deliveryType"]:checked').val(),
            paymentMethod: $('input[name="paymentMethod"]:checked').val(),
            instructions: $('#instructions').val(),
            orderDate: new Date().toISOString(),
            status: 'confirmed',
            total: parseInt($('#total-amount').text().replace('₹', ''))
        };

        // Show loading
        $('#place-order').html('<i class="fas fa-spinner fa-spin me-2"></i>Processing Order...');

        // Simulate order processing
        setTimeout(() => {
            // Save order to localStorage
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.unshift(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));

            // Clear cart
            localStorage.removeItem('cart');

            // Redirect to tracking page
            window.location.href = `order-tracking.html?orderId=${orderData.orderId}`;
        }, 2000);
    }

    // Show message
    function showMessage(message, type = 'success') {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show custom-alert" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(alert);
        setTimeout(() => alert.alert('close'), 3000);
    }

    // Initialize the page
    init();
});
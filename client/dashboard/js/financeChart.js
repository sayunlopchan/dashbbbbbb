// barchart for finance (membership, product)
document.addEventListener('DOMContentLoaded', async () => {
    const financeBarChart = document.getElementById('financeBarChart');
    const chartTitle = document.querySelector('#barChartYear');

    // Only run finance chart if we're on the finance page
    if (financeBarChart && chartTitle) {
        // Get current year
        const currentYear = new Date().getFullYear();
        chartTitle.textContent = `Revenue Finance - ${currentYear}`;

        // Function to create finance bar chart
        async function createFinanceBarChart() {
            try {
                // Fetch payment data for the current year
                const response = await fetch(`${baseUrl}/api/payments?year=${currentYear}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch payment data');
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch payment data');
                }

                // Clear any existing chart
                financeBarChart.innerHTML = '';

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                const monthlyData = months.map(month => ({
                    month,
                    membership: 0,
                    product: 0
                }));

                // Process payment data
                if (data.data.payments && Array.isArray(data.data.payments)) {
                    data.data.payments.forEach(payment => {
                        const paymentDate = new Date(payment.paymentDate);
                        if (!isNaN(paymentDate) && paymentDate.getFullYear() === currentYear) {
                            const monthIndex = paymentDate.getMonth();
                            if (payment.paymentType === 'membership') {
                                monthlyData[monthIndex].membership += payment.amount;
                            } else if (payment.paymentType === 'product') {
                                monthlyData[monthIndex].product += payment.amount;
                            }
                        }
                    });
                }

                // Find max value for scaling
                const maxValue = Math.max(
                    ...monthlyData.map(item => Math.max(item.membership, item.product))
                );

                // Create bars
                monthlyData.forEach(item => {
                    const barContainer = document.createElement('div');
                    barContainer.classList.add('bar-chart-group');

                    // Membership revenue bar
                    const membershipBar = document.createElement('div');
                    membershipBar.classList.add('bar-chart-bar', 'membership-bar');
                    const membershipBarHeight = maxValue > 0 ? (item.membership / maxValue) * 250 : 0;
                    membershipBar.style.height = `${membershipBarHeight}px`;

                    // Product revenue bar
                    const productBar = document.createElement('div');
                    productBar.classList.add('bar-chart-bar', 'product-bar');
                    const productBarHeight = maxValue > 0 ? (item.product / maxValue) * 250 : 0;
                    productBar.style.height = `${productBarHeight}px`;

                    // Month label
                    const monthLabel = document.createElement('div');
                    monthLabel.classList.add('bar-chart-label');
                    monthLabel.textContent = item.month;

                    // Add bars first, then the label
                    barContainer.appendChild(membershipBar);
                    barContainer.appendChild(productBar);
                    barContainer.appendChild(monthLabel);

                    // Add tooltip with more detailed information
                    barContainer.title = `${item.month} ${currentYear}\nMembership Revenue: NPR ${item.membership.toLocaleString()}\nProduct Revenue: NPR ${item.product.toLocaleString()}`;

                    financeBarChart.appendChild(barContainer);
                });

                // Add a note if no data is found
                if (maxValue === 0) {
                    financeBarChart.innerHTML = `
                        <div style="text-align: center; width: 100%; color: #888;">
                            No revenue data available for ${currentYear}
                        </div>
                    `;
                }

            } catch (error) {
                console.error('Error creating finance bar chart:', error);
                financeBarChart.innerHTML = `
                    <div style="text-align: center; width: 100%; color: #888;">
                        Unable to load finance chart data
                    </div>
                `;
            }
        }

        // Initial data fetch
        await createFinanceBarChart();

        // Refresh data every hour
        setInterval(createFinanceBarChart, 60 * 60 * 1000);
    }
});


// pieChart for finance revenue distribution
document.addEventListener('DOMContentLoaded', async () => {
    console.log('PieChart.js loaded');
    const revenuePieChart = document.getElementById('revenuePieChart');
    console.log('revenuePieChart element:', revenuePieChart);

    // Only run finance pie chart if we're on the finance page
    if (revenuePieChart) {
        // Function to create finance pie chart
        async function createFinancePieChart() {
            try {
                console.log('Creating finance pie chart...');
                // Fetch payment data
                const response = await fetch(`${baseUrl}/api/payments/stats`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch payment data');
                }

                const data = await response.json();
                console.log('Received data:', data);

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch payment data');
                }

                // Clear any existing chart
                revenuePieChart.innerHTML = '';

                // Create SVG container
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('viewBox', '0 0 200 200');

                // Pie chart colors
                const colors = {
                    'membership': '#4e73df',  // Blue for membership
                    'product': '#f6c23e'      // Yellow for product
                };

                const stats = data.data;
                const revenueByType = stats.revenueByType;
                const totalRevenue = stats.totalRevenue;

                console.log('Revenue data:', {
                    revenueByType,
                    totalRevenue
                });

                if (totalRevenue === 0) {
                    revenuePieChart.innerHTML = `
                        <div style="text-align: center; width: 100%; color: #888;">
                            No revenue data available
                        </div>
                    `;
                    return;
                }

                // Calculate angles
                let startAngle = 0;
                const centerX = 100;
                const centerY = 100;
                const radius = 80;
                const donutHoleRadius = 40;

                // Create pie slices for membership and product revenue
                const revenueData = [
                    { type: 'membership', value: revenueByType.membership },
                    { type: 'product', value: revenueByType.product }
                ];

                // Filter out zero values and handle single data point case
                const nonZeroData = revenueData.filter(item => item.value > 0);
                
                if (nonZeroData.length === 0) {
                    revenuePieChart.innerHTML = `
                        <div style="text-align: center; width: 100%; color: #888;">
                            No revenue data available
                        </div>
                    `;
                    return;
                }

                // If there's only one type of revenue, create a full circle
                if (nonZeroData.length === 1) {
                    const { type, value } = nonZeroData[0];
                    const percentage = 100;
                    
                    // Create a full circle
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', `
                        M ${centerX} ${centerY - radius}
                        A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius}
                        A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius}
                    `);
                    path.setAttribute('fill', colors[type]);
                    path.setAttribute('stroke', 'white');
                    path.setAttribute('stroke-width', '1');

                    // Create tooltip
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('pie-chart-tooltip');
                    tooltip.style.position = 'fixed';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.innerHTML = `
                        <strong>${type.charAt(0).toUpperCase() + type.slice(1)} Revenue</strong>
                        NPR ${value.toLocaleString()} (100%)
                    `;

                    // Add hover interactions
                    path.addEventListener('mouseenter', (e) => {
                        path.setAttribute('filter', 'url(#shadow)');
                        tooltip.style.opacity = '1';
                        
                        const tooltipX = e.clientX;
                        const tooltipY = e.clientY - 10;
                        
                        tooltip.style.left = `${tooltipX}px`;
                        tooltip.style.top = `${tooltipY}px`;
                        tooltip.style.transform = 'translate(-50%, -100%)';
                    });

                    path.addEventListener('mouseleave', () => {
                        path.removeAttribute('filter');
                        tooltip.style.opacity = '0';
                    });

                    path.addEventListener('mousemove', (e) => {
                        const tooltipX = e.clientX;
                        const tooltipY = e.clientY - 10;
                        
                        tooltip.style.left = `${tooltipX}px`;
                        tooltip.style.top = `${tooltipY}px`;
                        tooltip.style.transform = 'translate(-50%, -100%)';
                    });

                    svg.appendChild(path);
                    document.body.appendChild(tooltip);
                } else {
                    // Handle multiple data points as before
                    let startAngle = 0;
                    nonZeroData.forEach(({ type, value }) => {
                        const percentage = value / totalRevenue;
                        const angle = percentage * 360;
                        const endAngle = startAngle + angle;

                        // Convert polar to cartesian coordinates
                        const startX = centerX + radius * Math.cos(Math.PI * startAngle / 180);
                        const startY = centerY + radius * Math.sin(Math.PI * startAngle / 180);
                        const endX = centerX + radius * Math.cos(Math.PI * endAngle / 180);
                        const endY = centerY + radius * Math.sin(Math.PI * endAngle / 180);

                        // Inner circle points
                        const innerStartX = centerX + donutHoleRadius * Math.cos(Math.PI * startAngle / 180);
                        const innerStartY = centerY + donutHoleRadius * Math.sin(Math.PI * startAngle / 180);
                        const innerEndX = centerX + donutHoleRadius * Math.cos(Math.PI * endAngle / 180);
                        const innerEndY = centerY + donutHoleRadius * Math.sin(Math.PI * endAngle / 180);

                        // Determine large arc flag
                        const largeArcFlag = angle > 180 ? 1 : 0;

                        // Create path for donut chart
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', `
                            M ${innerStartX} ${innerStartY}
                            L ${startX} ${startY}
                            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
                            L ${innerEndX} ${innerEndY}
                            A ${donutHoleRadius} ${donutHoleRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
                            Z
                        `);
                        path.setAttribute('fill', colors[type]);
                        path.setAttribute('stroke', 'white');
                        path.setAttribute('stroke-width', '1');

                        // Create tooltip
                        const tooltip = document.createElement('div');
                        tooltip.classList.add('pie-chart-tooltip');
                        tooltip.style.position = 'fixed';
                        tooltip.style.zIndex = '1000';
                        tooltip.style.pointerEvents = 'none';
                        tooltip.innerHTML = `
                            <strong>${type.charAt(0).toUpperCase() + type.slice(1)} Revenue</strong>
                            NPR ${value.toLocaleString()} (${(percentage * 100).toFixed(1)}%)
                        `;

                        // Add hover interactions
                        path.addEventListener('mouseenter', (e) => {
                            path.setAttribute('filter', 'url(#shadow)');
                            tooltip.style.opacity = '1';
                            
                            const tooltipX = e.clientX;
                            const tooltipY = e.clientY - 10;
                            
                            tooltip.style.left = `${tooltipX}px`;
                            tooltip.style.top = `${tooltipY}px`;
                            tooltip.style.transform = 'translate(-50%, -100%)';
                        });

                        path.addEventListener('mouseleave', () => {
                            path.removeAttribute('filter');
                            tooltip.style.opacity = '0';
                        });

                        path.addEventListener('mousemove', (e) => {
                            const tooltipX = e.clientX;
                            const tooltipY = e.clientY - 10;
                            
                            tooltip.style.left = `${tooltipX}px`;
                            tooltip.style.top = `${tooltipY}px`;
                            tooltip.style.transform = 'translate(-50%, -100%)';
                        });

                        svg.appendChild(path);
                        document.body.appendChild(tooltip);
                        
                        // Update start angle for next slice
                        startAngle = endAngle;
                    });
                }

                // Add shadow filter for hover effect
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                filter.setAttribute('id', 'shadow');
                filter.setAttribute('height', '130%');
                filter.setAttribute('width', '130%');
                
                const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
                feDropShadow.setAttribute('dx', '0');
                feDropShadow.setAttribute('dy', '0');
                feDropShadow.setAttribute('stdDeviation', '3');
                feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.3)');
                
                filter.appendChild(feDropShadow);
                defs.appendChild(filter);
                svg.appendChild(defs);

                revenuePieChart.appendChild(svg);

                // Create legend
                const legendContainer = document.createElement('div');
                legendContainer.classList.add('pie-chart-legend');

                nonZeroData.forEach(({ type, value }) => {
                    const percentage = (value / totalRevenue * 100).toFixed(1);
                    const legendItem = document.createElement('div');
                    legendItem.classList.add('legend-item');
                    legendItem.innerHTML = `
                        <span class="legend-color" style="background-color: ${colors[type]}"></span>
                        <span class="legend-text">${type.charAt(0).toUpperCase() + type.slice(1)}: NPR ${value.toLocaleString()} (${percentage}%)</span>
                    `;
                    legendContainer.appendChild(legendItem);
                });

                revenuePieChart.appendChild(legendContainer);
                console.log('Pie chart created successfully');

            } catch (error) {
                console.error('Error creating finance pie chart:', error);
                revenuePieChart.innerHTML = `
                    <div style="text-align: center; width: 100%; color: #888;">
                        Unable to load finance chart data: ${error.message}
                    </div>
                `;
            }
        }

        // Initial data fetch
        await createFinancePieChart();

        // Refresh data every hour
        setInterval(createFinancePieChart, 60 * 60 * 1000);
    } else {
        console.log('revenuePieChart element not found');
    }
});


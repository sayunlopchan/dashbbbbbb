// barchart for member vs application
document.addEventListener('DOMContentLoaded', async () => {
    const memberBarChart = document.getElementById('memberBarChart');
    const chartTitle = document.querySelector('.chart-title');

    // Only run member vs application chart if we're on the dashboard page
    if (memberBarChart && chartTitle) {
        // Get current year
        const currentYear = new Date().getFullYear();
        chartTitle.textContent = `Members vs Applications - ${currentYear}`;

        // Function to create bar chart
        function createMemberApplicationBarChart(membersData, applicationsData) {
            // Clear any existing chart
            memberBarChart.innerHTML = '';

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const monthlyData = months.map(month => ({
                month,
                members: 0,
                applications: 0
            }));

            // Process members data - filter by current year
            if (membersData.data && Array.isArray(membersData.data)) {
                membersData.data.forEach(member => {
                    const registrationDate = new Date(member.createdAt);
                    // Check if the date is valid and from current year
                    if (!isNaN(registrationDate) && registrationDate.getFullYear() === currentYear) {
                        const monthIndex = registrationDate.getMonth();
                        monthlyData[monthIndex].members++;
                    }
                });
            }

            // Process applications data - filter by current year
            if (applicationsData.data && Array.isArray(applicationsData.data)) {
                applicationsData.data.forEach(application => {
                    // Use createdAt if convertedToMemberAt is not available
                    const applicationDate = new Date(application.convertedToMemberAt || application.createdAt);
                    // Check if the date is valid and from current year
                    if (!isNaN(applicationDate) && applicationDate.getFullYear() === currentYear) {
                        const monthIndex = applicationDate.getMonth();
                        monthlyData[monthIndex].applications++;
                    }
                });
            }

            // Find max value for scaling
            const maxValue = Math.max(
                ...monthlyData.map(item => Math.max(item.members, item.applications))
            );

            // Create bars
            monthlyData.forEach(item => {
                const barContainer = document.createElement('div');
                barContainer.classList.add('bar-chart-group');

                // Members bar
                const memberBar = document.createElement('div');
                memberBar.classList.add('bar-chart-bar', 'members-bar');
                const memberBarHeight = maxValue > 0 ? (item.members / maxValue) * 250 : 0;
                memberBar.style.height = `${memberBarHeight}px`;

                // Applications bar
                const applicationBar = document.createElement('div');
                applicationBar.classList.add('bar-chart-bar', 'applications-bar');
                const applicationBarHeight = maxValue > 0 ? (item.applications / maxValue) * 250 : 0;
                applicationBar.style.height = `${applicationBarHeight}px`;

                // Month label
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('bar-chart-label');
                monthLabel.textContent = item.month;

                // Add bars first, then the label
                barContainer.appendChild(memberBar);
                barContainer.appendChild(applicationBar);
                barContainer.appendChild(monthLabel);

                // Add tooltip with more detailed information
                barContainer.title = `${item.month} ${currentYear}\nMembers: ${item.members}\nApplications: ${item.applications}`;

                memberBarChart.appendChild(barContainer);
            });

            // Add a note if no data is found
            if (maxValue === 0) {
                memberBarChart.innerHTML = `
                    <div style="text-align: center; width: 100%; color: #888;">
                        No data available for ${currentYear}
                    </div>
                `;
            }
        }

        async function fetchAllMembers() {
            let allMembers = [];
            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const response = await fetch(`/api/members?page=${currentPage}&limit=100`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch members data');
                }

                const data = await response.json();
                allMembers = allMembers.concat(data.data);

                // Check if there are more pages
                hasMorePages = currentPage < data.pages;
                currentPage++;
            }

            return { data: allMembers };
        }

        async function fetchMemberApplicationData() {
            try {
                // Fetch all members data with pagination handling
                const membersData = await fetchAllMembers();

                // Fetch application history data
                const applicationsResponse = await fetch('/api/application-history', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!applicationsResponse.ok) {
                    throw new Error('Failed to fetch application data');
                }

                const applicationsData = await applicationsResponse.json();

                createMemberApplicationBarChart(membersData, applicationsData);

            } catch (error) {
                console.error('Error fetching data:', error);
                memberBarChart.innerHTML = `
                    <div style="text-align: center; width: 100%; color: #888;">
                        Unable to load member and application chart data
                    </div>
                `;
            }
        }

        // Initial data fetch
        await fetchMemberApplicationData();

        // Check for year change every hour
        setInterval(() => {
            const newYear = new Date().getFullYear();
            if (newYear !== currentYear) {
                window.location.reload();
            }
        }, 60 * 60 * 1000);
    }
});






// pieChart for membership Type
document.addEventListener('DOMContentLoaded', async () => {
    const membershipPieChart = document.getElementById('membershipPieChart');

    // Function to create pie chart
    function createMembershipPieChart(membershipData) {
        // Clear any existing chart
        membershipPieChart.innerHTML = '';

        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 200 200');

        // Pie chart colors
        const colors = {
            'silver': '#bdc3c7',   // Silver color
            'gold': '#FFC300',     // Gold color
            'diamond': '#1CD05E',  // Diamond color
            'platinum': '#CB0101'  // Platinum color
        };

        // Calculate total members
        const totalMembers = Object.values(membershipData).reduce((a, b) => a + b, 0);
        if (totalMembers === 0) {
            membershipPieChart.innerHTML = `
                <div style="text-align: center; width: 100%; color: #888;">
                    No membership data available
                </div>
            `;
            return;
        }

        // Calculate angles
        const centerX = 100;
        const centerY = 100;
        const radius = 80;
        const donutHoleRadius = 40;

        // Filter out zero values and handle single data point case
        const nonZeroData = Object.entries(membershipData).filter(([_, count]) => count > 0);
        
        if (nonZeroData.length === 0) {
            membershipPieChart.innerHTML = `
                <div style="text-align: center; width: 100%; color: #888;">
                    No membership data available
                </div>
            `;
            return;
        }

        // If there's only one type of membership, create a full circle
        if (nonZeroData.length === 1) {
            const [type, count] = nonZeroData[0];
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
            tooltip.innerHTML = `
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                ${count} members (100%)
            `;

            // Add hover interactions
            path.addEventListener('mouseenter', (e) => {
                path.setAttribute('filter', 'url(#shadow)');
                tooltip.style.opacity = '1';
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY - 10) + 'px';
            });

            path.addEventListener('mouseleave', () => {
                path.removeAttribute('filter');
                tooltip.style.opacity = '0';
            });

            path.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY - 10) + 'px';
            });

            svg.appendChild(path);
            document.body.appendChild(tooltip);
        } else {
            // Handle multiple data points as before
            let startAngle = 0;
            nonZeroData.forEach(([type, count]) => {
                const percentage = count / totalMembers;
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
                tooltip.innerHTML = `
                    <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                    ${count} members (${(percentage * 100).toFixed(1)}%)
                `;

                // Add hover interactions
                path.addEventListener('mouseenter', (e) => {
                    path.setAttribute('filter', 'url(#shadow)');
                    tooltip.style.opacity = '1';
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 10) + 'px';
                });

                path.addEventListener('mouseleave', () => {
                    path.removeAttribute('filter');
                    tooltip.style.opacity = '0';
                });

                path.addEventListener('mousemove', (e) => {
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 10) + 'px';
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

        membershipPieChart.appendChild(svg);

        // Create legend
        const legendContainer = document.createElement('div');
        legendContainer.classList.add('pie-chart-legend');

        nonZeroData.forEach(([type, count]) => {
            const percentage = (count / totalMembers * 100).toFixed(1);
            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');
            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[type]}"></span>
                <span class="legend-text">${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} (${percentage}%)</span>
            `;
            legendContainer.appendChild(legendItem);
        });

        membershipPieChart.appendChild(legendContainer);
    }

    async function fetchMembershipData() {
        try {
            const response = await fetch(`${baseUrl}/api/members`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch members');
            }

            const data = await response.json();
            const membershipTypes = {
                'silver': 0,
                'gold': 0,
                'diamond': 0,
                'platinum': 0
            };

            if (data.success && Array.isArray(data.data)) {
                data.data.forEach(member => {
                    if (member.membershipType && membershipTypes.hasOwnProperty(member.membershipType)) {
                        membershipTypes[member.membershipType]++;
                    }
                });
            }

            // Create pie chart with real data
            createMembershipPieChart(membershipTypes);

        } catch (error) {
            console.error('Error fetching membership data:', error);
            membershipPieChart.innerHTML = `
                <div style="text-align: center; width: 100%; color: #888;">
                    Unable to load membership chart data
                </div>
            `;
        }
    }

    // Initial data fetch
    await fetchMembershipData();

    // Refresh data periodically
    setInterval(fetchMembershipData, 5 * 60 * 1000); // Refresh every 5 minutes
});



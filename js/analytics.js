// analytics.js - initializes Chart.js visualizations and PDF export

(async () => {
  // Helper to create Chart instances
  const createChart = (ctx, type, data, options) => new Chart(ctx, { type, data, options });

  // Fetch data from State getters
  const techData = await State.getUserTechnologies();
  const projCatData = await State.getProjectCategories();
  const eventPartData = await State.getEventParticipation();
  const interestData = await State.getInterestAreas();
  const projStatusData = await State.getProjectStatusCounts();

  // 1. Tecnologias mais utilizadas - Doughnut
  const techCtx = document.getElementById('chart-tech').getContext('2d');
  createChart(techCtx, 'doughnut', {
    labels: Object.keys(techData),
    datasets: [{
      label: 'Tecnologias',
      data: Object.values(techData),
      backgroundColor: generateColors(Object.keys(techData).length, 0.7),
      borderColor: generateColors(Object.keys(techData).length, 1),
      borderWidth: 1
    }]
  }, {
    responsive: true,
    plugins: { legend: { position: 'right' } }
  });

  // 2. Projetos por categoria - Bar (horizontal)
  const projCatCtx = document.getElementById('chart-proj-cat').getContext('2d');
  createChart(projCatCtx, 'bar', {
    labels: Object.keys(projCatData),
    datasets: [{
      label: 'Projetos',
      data: Object.values(projCatData),
      backgroundColor: generateColors(Object.keys(projCatData).length, 0.6)
    }]
  }, {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  });

  // 3. Participação em Eventos - Bar (vertical)
  const eventPartCtx = document.getElementById('chart-event-part').getContext('2d');
  createChart(eventPartCtx, 'bar', {
    labels: Object.keys(eventPartData),
    datasets: [{
      label: 'Participantes',
      data: Object.values(eventPartData),
      backgroundColor: generateColors(Object.keys(eventPartData).length, 0.6)
    }]
  }, {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  });

  // 4. Áreas de interesse - Pie
  const interestCtx = document.getElementById('chart-interest').getContext('2d');
  createChart(interestCtx, 'pie', {
    labels: Object.keys(interestData),
    datasets: [{
      label: 'Interesse',
      data: Object.values(interestData),
      backgroundColor: generateColors(Object.keys(interestData).length, 0.7)
    }]
  }, { responsive: true, plugins: { legend: { position: 'right' } } });

  // 5. Status dos Projetos - Horizontal Bar
  const projStatusCtx = document.getElementById('chart-proj-status').getContext('2d');
  createChart(projStatusCtx, 'bar', {
    labels: Object.keys(projStatusData),
    datasets: [{
      label: 'Quantidade',
      data: Object.values(projStatusData),
      backgroundColor: generateColors(Object.keys(projStatusData).length, 0.6)
    }]
  }, {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  });

  // PDF Export handling
  const exportBtn = document.getElementById('export-pdf');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const element = document.querySelector('.analytics-section');
      const opt = {
        margin:       0.5,
        filename:     'analytics.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore - html2pdf is loaded globally
      html2pdf().set(opt).from(element).save();
    });
  }

  // Utility: generate array of HSLA colors for chart palettes
  function generateColors(count, alpha) {
    const colors = [];
    const step = Math.floor(360 / count);
    for (let i = 0; i < count; i++) {
      const hue = (i * step) % 360;
      colors.push(`hsla(${hue}, 70%, 50%, ${alpha})`);
    }
    return colors;
  }
})();

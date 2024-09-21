function setView(view, clickedButton) {
    // Remove the 'active' class from all buttons
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => button.classList.remove('active'));

    // Add the 'active' class to the clicked button
    clickedButton.classList.add('active');

    // Reset all grid items to be visible and remove the full-screen effect
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        item.classList.remove('hidden', 'full-screen');
    });

    // Adjust layout based on the selected view
    const rightSection = document.getElementById('rightSection');
    if (view === 'WARD') {
        // Show all patients in a 2x2 grid
        rightSection.style.gridTemplateColumns = '1fr 1fr';
        rightSection.style.gridTemplateRows = '1fr 1fr';
    } else {
        // Hide all other patients and make the selected one fill the entire right section
        rightSection.style.gridTemplateColumns = '1fr';
        rightSection.style.gridTemplateRows = '1fr';

        // Set the iframe source based on the selected patient
        const patientIframeSrcs = {
            'PATIENT 1': 'https://ns-11.oracle.cgmsim.com',
            'PATIENT 2': 'https://ns-12.oracle.cgmsim.com',
            'PATIENT 3': 'https://ns-13.oracle.cgmsim.com',
            'PATIENT 4': 'https://ns-14.oracle.cgmsim.com'
        };

        // Hide all other patients
        gridItems.forEach(item => item.classList.add('hidden'));

        // Show the selected patient
        const selectedPatientId = `patient${view.split(' ')[1]}`; // 'patient1', 'patient2', etc.
        const selectedPatient = document.getElementById(selectedPatientId);
        selectedPatient.classList.remove('hidden');
        selectedPatient.classList.add('full-screen');

        // Set the iframe src to reload the patient frame
        const iframe = selectedPatient.querySelector('iframe');
        iframe.src = patientIframeSrcs[view]; // Reload the iframe content
    }
}

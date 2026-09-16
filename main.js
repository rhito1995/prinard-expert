document.addEventListener('DOMContentLoaded', () => {
    const quoteForm = document.getElementById('quoteForm');
    const submitBtn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('formAlert');
    const apiBaseUrl = window.location.port === '8000' ? 'http://localhost:8080' : '';

    quoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button to prevent double-submission
        submitBtn.disabled = true;
        submitBtn.innerText = "Transmitting Brief...";
        alertBox.classList.add('d-none');

        const formData = new FormData(quoteForm);

        try {
            const response = await fetch(`${apiBaseUrl}/api/submit-brief`, {
                method: 'POST',
                body: formData
            });

            let result = { success: false, message: 'Submission failed.' };

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                if (text) result.message = text;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Request failed with status ${response.status}.`);
            }

            alertBox.className = "alert alert-success mt-3";
            alertBox.innerText = result.message;
            alertBox.classList.remove('d-none');
            quoteForm.reset();

        } catch (error) {
            alertBox.className = "alert alert-danger mt-3";
            alertBox.innerText = error.message || 'Error submitting request. Please try again.';
            alertBox.classList.remove('d-none');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Brief for Evaluation";
        }
    });
});
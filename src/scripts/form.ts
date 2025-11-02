/**
 * Form Submission Script
 * 
 * Handles the Add App form submission.
 * - Validates that either App Store ID or Website URL is provided
 * - Shows loading state during submission
 * - Displays success/error messages
 * - Reloads page on successful submission
 */

const form = document.getElementById('startup-form') as HTMLFormElement;
const messageDiv = document.getElementById('form-message') as HTMLDivElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const btnText = submitBtn.querySelector('.btn-text') as HTMLSpanElement;
const btnLoader = submitBtn.querySelector('.btn-loader') as HTMLSpanElement;

form.addEventListener('submit', async (e) => {
	e.preventDefault();
	
	const formData = new FormData(form);
	const appStoreId = formData.get('appStoreId')?.toString().trim() || '';
	const websiteUrl = formData.get('websiteUrl')?.toString().trim() || '';
	
	// Validate that at least one of appStoreId or websiteUrl is provided
	if (!appStoreId && !websiteUrl) {
		messageDiv.className = 'message error';
		messageDiv.textContent = 'Either App Store ID or Website is required (at least one to fetch the app icon)';
		messageDiv.style.display = 'block';
		return;
	}
	
	const data = {
		name: formData.get('name'),
		websiteUrl: websiteUrl || null,
		appStoreId: appStoreId || null,
		founderUsername: formData.get('founderUsername'),
		projectId: formData.get('projectId'),
		revenuecatApiKey: formData.get('revenuecatApiKey'),
	};

	messageDiv.style.display = 'none';
	submitBtn.disabled = true;
	btnText.style.display = 'none';
	btnLoader.style.display = 'inline';

	try {
		const response = await fetch('/api/add-startup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		const result = await response.json();

		if (response.ok) {
			messageDiv.className = 'message success';
			messageDiv.textContent = `Added "${result.startup.name}"`;
			messageDiv.style.display = 'block';
			setTimeout(() => window.location.reload(), 1000);
		} else {
			messageDiv.className = 'message error';
			messageDiv.textContent = result.error || 'Failed to add app';
			messageDiv.style.display = 'block';
			submitBtn.disabled = false;
			btnText.style.display = 'inline';
			btnLoader.style.display = 'none';
		}
	} catch (error) {
		messageDiv.className = 'message error';
		messageDiv.textContent = 'An error occurred';
		messageDiv.style.display = 'block';
		submitBtn.disabled = false;
		btnText.style.display = 'inline';
		btnLoader.style.display = 'none';
	}
});


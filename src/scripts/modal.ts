/**
 * Modal Management Script
 * 
 * Handles the Add App modal open/close functionality.
 * - Opens modal from multiple trigger buttons
 * - Closes via close button, cancel button, backdrop click, or ESC key
 * - Manages body scroll lock when modal is open
 * - Resets form on close
 */

const modal = document.getElementById('modal') as HTMLDivElement;
const openModalBtn = document.getElementById('open-modal') as HTMLButtonElement;
const openModalEmptyBtn = document.getElementById('open-modal-empty') as HTMLButtonElement;
const closeModalBtn = document.getElementById('close-modal') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-modal') as HTMLButtonElement;
const backdrop = document.getElementById('modal-backdrop') as HTMLDivElement;
const form = document.getElementById('startup-form') as HTMLFormElement;
const messageDiv = document.getElementById('form-message') as HTMLDivElement;

function openModal() {
	modal.classList.add('active');
	document.body.style.overflow = 'hidden';
}

function closeModal() {
	modal.classList.remove('active');
	document.body.style.overflow = '';
	form.reset();
	messageDiv.style.display = 'none';
}

// Event listeners for opening the modal
openModalBtn?.addEventListener('click', openModal);
openModalEmptyBtn?.addEventListener('click', openModal);

// Event listeners for closing the modal
closeModalBtn?.addEventListener('click', closeModal);
cancelBtn?.addEventListener('click', closeModal);
backdrop?.addEventListener('click', closeModal);

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && modal.classList.contains('active')) {
		closeModal();
	}
});


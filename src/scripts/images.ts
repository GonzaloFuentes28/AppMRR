/**
 * Image Error Handling Script
 * 
 * Handles fallback for broken images:
 * - Twitter/X avatars fall back to dicebear avatars
 * - App logos/favicons fall back to placeholder image
 * 
 * Runs on DOM ready to catch images that may already be broken
 */

document.addEventListener('DOMContentLoaded', () => {
	// Handle founder avatar errors
	const founderAvatars = document.querySelectorAll('.founder-avatar') as NodeListOf<HTMLImageElement>;
	founderAvatars.forEach(img => {
		img.addEventListener('error', function() {
			if (!this.src.includes('dicebear')) {
				const username = this.getAttribute('data-username') || this.alt || 'user';
				this.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
			}
		});
		
		// Also handle load error immediately if image is already broken
		if (img.complete && img.naturalHeight === 0) {
			const username = img.getAttribute('data-username') || img.alt || 'user';
			img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
		}
	});

	// Handle app logo errors
	const appLogos = document.querySelectorAll('.app-logo') as NodeListOf<HTMLImageElement>;
	appLogos.forEach(img => {
		img.addEventListener('error', function() {
			if (this.src.includes('favicons')) {
				this.src = '/placeholder.svg';
			}
		});
	});
});


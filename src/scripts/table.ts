/**
 * Table Sorting Script
 * 
 * Handles the sortable column headers in the leaderboard table.
 * - Updates URL parameters when a column header is clicked
 * - Triggers page reload with new sort parameter
 * - Supports sorting by MRR or Revenue
 */

const sortButtons = document.querySelectorAll('.sort-header');

sortButtons.forEach(btn => {
	btn.addEventListener('click', () => {
		const field = btn.getAttribute('data-field');
		const url = new URL(window.location.href);
		url.searchParams.set('sort', field!);
		window.location.href = url.toString();
	});
});


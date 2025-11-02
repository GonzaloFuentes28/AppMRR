/**
 * Theme Management Script
 * 
 * Handles the light/dark theme toggle functionality.
 * - Saves theme preference to localStorage
 * - Applies theme on page load
 * - Updates theme icon (sun/moon)
 * - Manages both data-theme attribute and .dark class for compatibility
 */

const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const html = document.documentElement;

function initTheme() {
	const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
	// Apply both systems for compatibility: data-theme and .dark class
	html.setAttribute('data-theme', savedTheme);
	if (savedTheme === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
	updateThemeIcon(savedTheme);
}

function toggleTheme() {
	const currentTheme = (html.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
	html.setAttribute('data-theme', newTheme);
	if (newTheme === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
	localStorage.setItem('theme', newTheme);
	updateThemeIcon(newTheme);
}

function updateThemeIcon(theme: string) {
	const sunIcon = themeToggle.querySelector('.sun') as HTMLElement;
	const moonIcon = themeToggle.querySelector('.moon') as HTMLElement;
	if (theme === 'dark') {
		sunIcon.style.display = 'none';
		moonIcon.style.display = 'block';
	} else {
		sunIcon.style.display = 'block';
		moonIcon.style.display = 'none';
	}
}

// Initialize theme on page load
initTheme();

// Add event listener for theme toggle
themeToggle?.addEventListener('click', toggleTheme);


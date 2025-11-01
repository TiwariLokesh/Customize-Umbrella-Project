
const COLOR_CONFIG = {
	blue: {
		umbrella: 'images/Blue umbrella.png',
		alt: 'Blue umbrella',
		theme: {
			'--page-bg': '#d8f1ff',
			'--panel-bg': '#ffffff',
			'--accent': '#009fe3',
			'--text-primary': '#1f1f24',
			'--text-secondary': '#4d4d4f',
			'--shadow-color': 'rgba(0, 0, 0, 0.08)'
		}
	},
	pink: {
		umbrella: 'images/Pink umbrella.png',
		alt: 'Pink umbrella',
		theme: {
			'--page-bg': '#ffe8f3',
			'--panel-bg': '#ffffff',
			'--accent': '#ff5fa2',
			'--text-primary': '#2b1b26',
			'--text-secondary': '#5a3b51',
			'--shadow-color': 'rgba(255, 95, 162, 0.28)'
		}
	},
	yellow: {
		umbrella: 'images/Yellow umbrella.png',
		alt: 'Yellow umbrella',
		theme: {
			'--page-bg': '#fff4d1',
			'--panel-bg': '#ffffff',
			'--accent': '#f7b500',
			'--text-primary': '#2d2612',
			'--text-secondary': '#5f5235',
			'--shadow-color': 'rgba(247, 181, 0, 0.28)'
		}
	}
};

const swatchButtons = document.querySelectorAll('.color-swatch');
const umbrellaImage = document.getElementById('umbrella-image');
const loader = document.getElementById('image-loader');
const logoInput = document.getElementById('logo-input');
const logoPreview = document.getElementById('logo-preview');
const logoDropzone = document.getElementById('logo-dropzone');
const feedback = document.getElementById('feedback');
const root = document.documentElement;

let currentColor = 'blue';
const PREVIEW_DELAY_MS = 5000;
const loaderState = {
	color: false,
	logo: false
};
let logoLoadTimeout = null;

swatchButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const color = button.dataset.color;
		if (!color || color === currentColor) {
			return;
		}

		const config = COLOR_CONFIG[color];
		if (!config) {
			return;
		}

		updateActiveSwatch(color);
		applyTheme(config.theme);
		switchUmbrella(config);
		currentColor = color;
	});
});

umbrellaImage.addEventListener('load', () => {
	const nextAlt = umbrellaImage.dataset.nextAlt;
	if (nextAlt) {
		umbrellaImage.alt = nextAlt;
		delete umbrellaImage.dataset.nextAlt;
	}
	setLoaderState('color', false);
	umbrellaImage.style.opacity = '1';
});

umbrellaImage.addEventListener('error', () => {
	setLoaderState('color', false);
	showFeedback('Unable to load the selected umbrella. Please try again.', 'error');
});

logoInput.addEventListener('change', handleLogoUpload);

function updateActiveSwatch(color) {
	swatchButtons.forEach((button) => {
		const isActive = button.dataset.color === color;
		button.classList.toggle('is-active', isActive);
		button.setAttribute('aria-pressed', String(isActive));
	});
}

function applyTheme(theme) {
	Object.entries(theme).forEach(([variable, value]) => {
		root.style.setProperty(variable, value);
	});
}

function switchUmbrella(config) {
	umbrellaImage.style.opacity = '0';
	setLoaderState('color', true);
	umbrellaImage.dataset.nextAlt = config.alt;
	umbrellaImage.src = config.umbrella;
}

function setLoaderState(source, isActive) {
	loaderState[source] = isActive;
	const isSpinnerActive = loaderState.color || loaderState.logo;
	loader.classList.toggle('is-active', isSpinnerActive);
	loader.setAttribute('aria-busy', String(isSpinnerActive));
	umbrellaImage.classList.toggle('is-hidden', isSpinnerActive);
	umbrellaImage.style.opacity = isSpinnerActive ? '0' : '1';
	if (isSpinnerActive) {
		logoDropzone.style.visibility = 'hidden';
	} else {
		logoDropzone.style.visibility = '';
	}
}

function handleLogoUpload(event) {
	const file = event.target.files && event.target.files[0];
	if (!file) {
		return;
	}

	if (logoLoadTimeout) {
		clearTimeout(logoLoadTimeout);
		logoLoadTimeout = null;
	}
	setLoaderState('logo', false);

	const isValidType = ['image/png', 'image/jpeg'].includes(file.type);
	if (!isValidType) {
		showFeedback('Please upload a PNG or JPG image.', 'error');
		clearLogo();
		logoInput.value = '';
		setLoaderState('logo', false);
		return;
	}

	const maxFileSize = 5 * 1024 * 1024; // 5 MB limit required by specification
	if (file.size > maxFileSize) {
		showFeedback('File is larger than 5 MB. Please choose a smaller image.', 'error');
		clearLogo();
		logoInput.value = '';
		setLoaderState('logo', false);
		return;
	}

	// Remove any previous logo preview immediately so the spinner is visible under the delay.
	clearLogo();
	setLoaderState('logo', true);
	showFeedback('Processing logo preview...', null);

	const reader = new FileReader();
	reader.addEventListener('load', () => {
		const result = reader.result;
		if (typeof result === 'string') {
			logoLoadTimeout = window.setTimeout(() => {
				logoPreview.src = result;
				logoPreview.alt = `${file.name} logo preview`;
				logoDropzone.classList.add('is-visible');
				logoDropzone.setAttribute('aria-hidden', 'false');
				setLoaderState('logo', false);
				showFeedback('Logo added to the preview.', 'success');
				logoLoadTimeout = null;
			}, PREVIEW_DELAY_MS);
		} else {
			showFeedback('Something went wrong while reading the file. Please try again.', 'error');
			clearLogo();
			setLoaderState('logo', false);
			logoLoadTimeout = null;
		}
	});

	reader.addEventListener('error', () => {
		showFeedback('We could not read that image. Please try a different file.', 'error');
		clearLogo();
		setLoaderState('logo', false);
		logoLoadTimeout = null;
	});

	reader.readAsDataURL(file);
}

function clearLogo() {
	logoPreview.removeAttribute('src');
	logoPreview.removeAttribute('alt');
	logoDropzone.classList.remove('is-visible');
	logoDropzone.setAttribute('aria-hidden', 'true');
	logoDropzone.style.visibility = '';
}

function showFeedback(message, type) {
	feedback.textContent = message;
	feedback.classList.remove('is-error', 'is-success');
	if (type === 'error') {
		feedback.classList.add('is-error');
	} else if (type === 'success') {
		feedback.classList.add('is-success');
	}
}

// Ensure the starting state matches our defaults when the page loads.
applyTheme(COLOR_CONFIG[currentColor].theme);
logoDropzone.setAttribute('aria-hidden', 'true');

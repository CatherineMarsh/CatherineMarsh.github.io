const ideas = [
	"Wireless Earbuds",
	"Cozy Blanket",
	"Board Game For Family Nights",
	"Reusable Water Bottle",
	"Coffee Sampler Set",
	"Gift Card to a Favorite Store",
	"Scented Candle Set",
	"Portable Phone Charger",
	"Warm Winter Gloves",
	"A Good Book",
	"Cooking Gadget",
	"Subscription Box (snacks, books, coffee)",
	"Fitness Tracker",
	"Bluetooth Speaker",
	"Houseplant or Succulent",
	"Personalized Mug or Ornament"
];

function getRandomIdea() {
	return ideas[Math.floor(Math.random() * ideas.length)];
}

// items stored as { text: string, priority: 'Low'|'Medium'|'High' }
const ITEMS_KEY = 'christmas-list-items-v1';

function loadLegacyTextContent() {
	const legacy = localStorage.getItem('christmas-list-content-v1');

	if (!legacy) return [];
	return legacy.split(/\r?\n/).filter(Boolean).map(line => {
		// try to detect [Priority] prefix
		const m = line.match(/^\[(Low|Medium|High)\]\s*(.*)$/);
		if (m) return { text: m[2], priority: m[1] };
		return { text: line, priority: 'Medium' };
	});
	
}

function getSavedItems() {
	try {
		const raw = localStorage.getItem(ITEMS_KEY);
		if (raw) return JSON.parse(raw);
	} catch (e) {}
	// fallback to legacy textarea content
	return loadLegacyTextContent();
}

function saveItems(items) {
	localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function formatItemsForSending(items) {
	return items.map(it => `[${it.priority}] ${it.text}`).join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('generate-button');
	const last = document.getElementById('last-idea');
	const clearBtn = document.getElementById('clear-button');
	const sendBtn = document.getElementById('send-button');
	const addContactBtn = document.getElementById('add-contact');
	const contactsListEl = document.getElementById('contacts-list');
	const contactValueEl = document.getElementById('contact-value');
	const contactNicknameEl = document.getElementById('contact-nickname');
	const contactTypeEl = document.getElementById('contact-type');
	const prioritySelect = document.getElementById('priority');
	const insertCheckbox = document.getElementById('insert-at-cursor');
	const addItemBtn = document.getElementById('add-item');
	const newItemInput = document.getElementById('new-item');
	const newItemPriority = document.getElementById('new-item-priority');
	const itemsListEl = document.getElementById('items-list');
	const removeLastBtn = document.getElementById('remove-last-button');

	const CONTACTS_KEY = 'christmas-list-contacts-v1';

	if (!btn || !itemsListEl) return;

	// load saved items
	let items = getSavedItems();

	// track focused item index for insert-at-cursor behavior
	let focusedItemIndex = -1;

	function renderItems() {
		itemsListEl.innerHTML = '';
		items.forEach((it, idx) => {
			const li = document.createElement('li');
			li.className = 'item-row';
			li.dataset.index = String(idx);

			// text (editable)
			const textSpan = document.createElement('span');
			textSpan.className = 'item-text';
			textSpan.contentEditable = 'true';
			textSpan.spellcheck = false;
			textSpan.textContent = it.text;
			textSpan.addEventListener('focus', () => { focusedItemIndex = idx; });
			textSpan.addEventListener('blur', () => {
				const newText = textSpan.textContent.trim();
				items[idx].text = newText;
				saveItems(items);
			});

			// priority select
			const pSelect = document.createElement('select');
			['Low','Medium','High'].forEach(p => {
				const op = document.createElement('option'); op.value = p; op.textContent = p;
				if (p === it.priority) op.selected = true;
				pSelect.appendChild(op);
			});
			pSelect.addEventListener('change', () => {
				items[idx].priority = pSelect.value;
				saveItems(items);
			});

			// remove button
			const removeBtn = document.createElement('button');
			removeBtn.className = 'remove-item';
			removeBtn.textContent = 'Remove';
			removeBtn.addEventListener('click', () => {
				items.splice(idx, 1);
				saveItems(items);
				renderItems();
			});

			li.appendChild(textSpan);
			li.appendChild(pSelect);
			li.appendChild(removeBtn);
			itemsListEl.appendChild(li);
		});
	}

	renderItems();

	// load contacts
	let contacts = [];
	try {
		const raw = localStorage.getItem(CONTACTS_KEY);
		if (raw) contacts = JSON.parse(raw);
	} catch (e) {
		contacts = [];
	}

	function saveContacts() {
		localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
	}

	function renderContacts() {
		if (!contactsListEl) return;
		contactsListEl.innerHTML = '';
		contacts.forEach((c, i) => {
			const li = document.createElement('li');
			li.className = 'contact-row';
			// show nickname if present
			const nick = c.nickname ? ` ${escapeHtml('(' + c.nickname + ')')}` : '';
			li.innerHTML = `<span class="contact-text">${escapeHtml(c.value)}${nick} (${c.type})</span> <button data-index="${i}" class="remove-contact">Remove</button>`;
			contactsListEl.appendChild(li);
		});
		// attach remove handlers
		const removeBtns = document.querySelectorAll('.remove-contact');
		removeBtns.forEach(btn => {
			btn.addEventListener('click', (ev) => {
				const idx = Number(btn.getAttribute('data-index'));
				contacts.splice(idx, 1);
				saveContacts();
				renderContacts();
			});
		});
	}

	renderContacts();

	// add new item by input
	if (addItemBtn && newItemInput) {
		addItemBtn.addEventListener('click', () => {
			const val = (newItemInput.value || '').trim();
			if (!val) return;
			const pr = (newItemPriority && newItemPriority.value) || 'Medium';
			items.push({ text: val, priority: pr });
			saveItems(items);
			renderItems();
			newItemInput.value = '';
		});
		newItemInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') { e.preventDefault(); addItemBtn.click(); }
		});
	}

	btn.addEventListener('click', () => {
		const idea = getRandomIdea();
		const insertAtCursor = insertCheckbox && insertCheckbox.checked;
		const priority = (prioritySelect && prioritySelect.value) || 'Medium';
		if (insertAtCursor && focusedItemIndex >= 0 && focusedItemIndex < items.length) {
			items.splice(focusedItemIndex + 1, 0, { text: idea, priority });
		} else {
			items.push({ text: idea, priority });
		}
		saveItems(items);
		renderItems();
		if (last) last.textContent = `Added: [${priority}] ${idea}`;
	});

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			if (!confirm('Clear the entire list?')) return;
			items = [];
			saveItems(items);
			renderItems();
			if (last) last.textContent = 'List cleared';
		});
	}

	if (removeLastBtn) {
		removeLastBtn.addEventListener('click', () => {
			if (items.length === 0) return;
			items.pop();
			saveItems(items);
			renderItems();
		});
	}

	if (addContactBtn) {
		addContactBtn.addEventListener('click', () => {
			const raw = (contactValueEl && contactValueEl.value || '').trim();
			const nick = (contactNicknameEl && contactNicknameEl.value || '').trim();
			const type = (contactTypeEl && contactTypeEl.value) || 'email';
			if (!raw) return alert('Enter an email address or phone number');
			// basic validation
			if (type === 'email') {
				if (!/^\S+@\S+\.\S+$/.test(raw)) return alert('Enter a valid email address');
			} else {
				// normalize phone
				const pn = raw.replace(/[^0-9+]/g, '');
				if (!/[0-9]/.test(pn)) return alert('Enter a valid phone number');
			}
			contacts.push({ value: raw, type, nickname: nick });
			saveContacts();
			renderContacts();
			if (contactValueEl) contactValueEl.value = '';
			if (contactNicknameEl) contactNicknameEl.value = '';
		});
	}

	if (sendBtn) {
		sendBtn.addEventListener('click', () => {
			const content = formatItemsForSending(items);
			if (!content) return alert('List is empty');
			const emails = contacts.filter(c => c.type === 'email').map(c => c.value);
			const phones = contacts.filter(c => c.type === 'phone').map(c => c.value.replace(/[^0-9+]/g, ''));

			if (emails.length === 0 && phones.length === 0) return alert('No contacts to send to. Add contacts first.');

			// Send email to all emails (single mailto with multiple recipients)
			if (emails.length > 0) {
				const subject = encodeURIComponent('Christmas List');
				const body = encodeURIComponent(content);
				const to = encodeURIComponent(emails.join(','));
				const mailto = `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
				window.open(mailto, '_blank');
			}

			// For phones, attempt to open sms: links (may only work on mobile)
			phones.forEach((p, idx) => {
				const body = encodeURIComponent(content);
				// Using sms: URI; different platforms may vary
				const smsLink = `sms:${p}?body=${body}`;
				// stagger slightly to avoid some popup blockers
				setTimeout(() => window.open(smsLink, '_blank'), idx * 400);
			});
		});
	}
});

function escapeHtml(unsafe) {
	return unsafe.replace(/[&<>"']/g, function (m) {
		return ({
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		})[m];
	});
}

function insertAtCursorPosition(textarea, text) {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const before = textarea.value.substring(0, start);
	const after = textarea.value.substring(end);
	const newValue = before + text + after;
	textarea.value = newValue;
	const caret = start + text.length;
	textarea.setSelectionRange(caret, caret);
}

function addIdeaToList(idea, insertAtCursor = false) {
	const textarea = document.getElementById('list');
	if (!textarea) return;
	if (insertAtCursor) {
		insertAtCursorPosition(textarea, idea + '\n');
	} else {
		const current = textarea.value.trim();
		textarea.value = current ? current + '\n' + idea : idea;
	}
}

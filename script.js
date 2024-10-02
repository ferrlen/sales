/***
 * SELLING MY STUFF
 * This is a quick and dirty static website to sell my stuff asap. Don't expect best practices, except for security etc.  
 ***/

// DARK MODE
// JS for toggling dark mode
const darkModeComponent = document.getElementById('dark-mode-component');
// the dark-mode-component "switch" is just a HTML `input` type range: it's values are 1 for light mode, 0 for dark mode
if (localStorage.darkModeComponent === "1" || 
(!localStorage.darkModeComponent && window.matchMedia('(prefers-color-scheme: light)').matches)) {
	// page initial default value is dark mode, so if user prefers light, it has to change to light mode "1"
	document.body.classList.remove('dark');
	darkModeComponent.querySelector('input').value = "1";
}
function toggleDarkMode(ev) {
	localStorage.darkModeComponent = localStorage.darkModeComponent === "1" ? "0" : "1";
	const input = darkModeComponent.querySelector('input');
	input.value = localStorage.darkModeComponent;
	document.body.classList.toggle('dark');
};
darkModeComponent.addEventListener('click', toggleDarkMode, {capture: true});
// the following listener is needed for touch events, if user swipes the input slider with finger instead of clicking on it
darkModeComponent.addEventListener('change', toggleDarkMode);





// POPULATING PAGE
// add data contained in `stuff.txt` file to salesSection
(async function() {
	let salesSection = '<h2><i>On sale!</i></h2>';
	// `stuff` to sell is being fetched because I don't want the browser to cache the file. I don't control the server, so there are few other options
	let stuff = await fetch('./stuff.txt', {cache: "no-cache"})
		.catch((e) => alert('There was an error with the network, please check your internet connection and reload the page\n' + e)); 
	if (!stuff.ok) alert(`The page hasn't loaded successfully! Please reload it`); 
	stuff = await stuff.text();

	/*
		// example content for debugging: 
		let stuff = `
			<start>
				<music>
				title: 88 keys Digital Piano + stand with 3 pedals + bench
				price: $400, all included.
				img: piano.jpg;
				img: piano2.jpg;
				desc: Alesis Coda Pro - an 88 weighted keys digital piano
				+ official stand, with all 3 piano pedals - sustain, sostenuto, una corda (Coda Piano Stand)
				+ bench
				+ (extra sustain pedal, to use when somewhere else away from the stand)


				This is the perfect beginners kit to learn piano. This 88 weighted keys, velocity-sensitive digital piano has a few voices, 64 voices polyphony, a pitch wheel and many connectors:
				<ul><li>MIDI out</li>			<li>also Usb-MIDI</li>			<li>Stereo 1/4 inch aux input for playing along with external equipment.</li>			<li>Stereo 1/4 inch aux <i>output</i></li>		<li>Headphone jack (2 options: mute loudspeakers or have both headphone and loudspeakers sound (e.g., for plugging it into an amplifier)</li>	</ul>
				It has a bunch of functions, like scale, split, demo songs and record.

				<b>It comes with the official stand, with all 3 piano pedals</b>. The bench is also included in the price.

				It also comes with an extra sustain pedal -- in case you want to play the piano at a party or somewhere else -- and a bench.

				This product has been discontinued because a new line was released, but here's the old <a href="https://www.amazon.com/Alesis-Coda-Pro-Hammer-Action-Keyboard/dp/B00SHCDMRQ/">Amazon link</a>.
			<end> 

			<--com> template:
			<start>
			<music and/or sold>
				title: Digital Piano
				price: $400
				img: ;
				desc:
			<end>
			<com-->
		`;
	*/

	// parse fetched content
	stuff = stuff.trim().replace(/\t/g, '').replace(/<--com[\s\S]*com-->/g, '').replace(/\n/g, '<br><split>').split('<split>');
	{
		let writable = false;
		let article = '';
		let sold = false;
		let music = false;

		for (let line of stuff) {
			line = line.trim();
			if (line.startsWith('<start>')) {
				line = `<article class="item">`;
				writable = true;
			}
			else if (line.startsWith('title: ')) {
				line = line.replace('title: ', '');
				line = `<h3 class="title">${line}</h3>`;
			}
			else if (line.startsWith('desc: ')) {
				line = line.replace('desc: ', '');
				line = `<div class="description">${line}`;
			}
			else if (line.startsWith('price: ')) {
				line = line.replace('price: ', '');
				// content is being added in CSS .price::before
				line = `<div class="price">${line}</div>`;
			}
			else if (line.startsWith('img: ')) {
				line = line.match(/img:\s*(\w+\.\w+)/)[1];
				line = `<img src="./images/${line}"></img>`;
			}
			else if (line.startsWith('<sold>')) {
				sold = true;
				continue;
			}
			else if (line.startsWith('<music>')) {
				music = true;
				continue;
			}
			else if (line.startsWith('<end>')) {
				// </div> closes description 
				line = `</div></article>`;
				article += line;
				if (sold) {
					article = article.replace(`<article class="`, `<article class="sold `);
					sold = false;
				}
				if (music) {
					article = article.replace(`<article class="`, `<article class="music `);
					music = false;
				}
				salesSection += article;
				article = '';
				writable = false;
			}

			if (writable) article += line;
		}
	}

	// add fetched content to the DOM
	const sale = document.querySelector('#sale');
	sale.innerHTML = salesSection;

	// group all images together in one div
	for (const item of document.getElementsByClassName('item')) {
		const images = document.createElement('div');
		images.className = 'images';
		images.append(...item.getElementsByTagName('img'));
		item.appendChild(images);
	}

	// Remove loading animation once everything loads
	const loading = document.getElementById('loading');
	loading.style.opacity = 0;
	setTimeout(() => {
		loading.remove();
	}, 500);
})();





// SORTING
// function for sorting items for sale
function sortSales() {
	const entries = {};
	const sortedItems = [];

	for (input of document.querySelectorAll('#sort input')) {
		if (input.type !== 'text' && !input.checked) continue;
		entries[input.name] = input.value;
	}

	// validation
	if (entries.min && entries.max && (Number(entries.min) >= Number(entries.max))) return alert('Error: minimum price must be smaller than maximum!')
	if (entries.min && entries.max && (Number(entries.max) <= Number(entries.min))) return alert('Error: maximum price must be bigger than minimum!')

	for (const item of document.getElementsByClassName('item')) {
		const price = Number(item.querySelector('.price').textContent.match(/\$(\d+\.?\d*)/)[1]);
		item.price = price;

		if (entries.music && !item.classList.contains('music')) continue;
		  
		if (entries.min && (price < entries.min)) continue;
		if (entries.max && (price > entries.max)) continue;

		sortedItems.push(item);
	}

	sortedItems.sort((a,b) => {
		if (entries.sort === 'price') {
			return entries.direction === 'ascending' ? a.price > b.price : a.price < b.price;
		}
		else if (entries.sort === 'name') {
			return entries.direction === 'ascending' ? a.price > b.price : a.price < b.price;
		}
	});

	// add remaining items for sale to the bottom
	for (const item of document.getElementsByClassName('item')) {
		if (!sortedItems.includes(item)) sortedItems.push(item);
	}

	// update DOM
	document.getElementById('sale').append(...sortedItems);

	closeDialog();
}





// LIST
// Get all items and make a list of them, then add it to the `list` dialog
function listItems() {
	const allItems = [];
	for (const item of document.getElementsByClassName('item')) {
		const title = item.querySelector('.title').textContent;
		const price = item.querySelector('.price').textContent;
		const li = document.createElement('li');
		li.innerHTML = `${title}: <span class="list-price">${price}</span>`;

		// on click, scroll to item
		li.addEventListener('click', () => {
			let position = item.getBoundingClientRect().top;
			let offset = document.getElementById('top-nav').getBoundingClientRect().height;
			position = position > 0 ? position - offset : position + offset;
			window.scroll({top: position});
		});

		allItems.push(li);
	}
	document.querySelector('#list ol#list-items').replaceChildren(...allItems);
	
	// close list dialog after user clicks anywhere
	setTimeout(() => {
		// capture `true` in case user cancels dialog with Esc
		window.addEventListener('click', () => {closeDialog();}, {once: true, capture: true});
	}, 0);

	// finally, present list to user
	document.getElementById('list').showModal();
}





// DIALOGS
// switch closing functions of dialogs to closeDialog, because it has a closing animation that needs JS to retrigger
for (const dialog of document.getElementsByTagName('dialog')) {
	dialog.oncancel = (ev) => {
		ev.preventDefault();
		closeDialog();
	};
}

// before closing, this will first reverse the animation. It's incredibly hard to restart an animation without JS
function closeDialog() {
	// select whatever modal dialog is open
	const dialog = document.querySelector('dialog[open]');
	if (!dialog) return;
	// reverse the animations
	dialog.getAnimations().forEach(
		(animation) => {
			animation.finish(); // in case user cancels while original animation was starting
			animation.reverse();
		}
	);
	setTimeout(() => {
		dialog.classList.remove('closing');
		dialog.close();
	}, 400);
}
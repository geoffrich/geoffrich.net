function initProgressList() {
  const progressList = document.querySelector('.progress');
  progressList.setAttribute('role', 'list');
  progressList.dataset.init = true; // so we do not remove the list marker if javascript is disabled

  const listItems = document.querySelectorAll('.progress li');

  let hasCurrentBeenReached = false;
  listItems.forEach((item, idx) => {
    const current = item.getAttribute('aria-current');
    if (current === 'step') {
      hasCurrentBeenReached = true;
      item.dataset.state = 'current';
    } else if (!hasCurrentBeenReached) {
      item.dataset.state = 'previous';
    } else {
      item.dataset.state = 'upcoming';
    }

    item.innerHTML = getListItemContents(item.innerHTML, idx);
  });
}

const numberWords = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen' // could add more if necessary, but we have fallback to the number
];

function getListItemContents(text, index) {
  return `
      <div class="checkmark">
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.86783 0.140957C8.04941 0.313123 8.0627 0.605051 7.89751 0.792996L3.24446 6.08691C3.07926 6.27486 2.79815 6.28765 2.61657 6.11548L0.29174 3.91119C0.11016 3.73903 0.0968757 3.4471 0.262069 3.25915C0.427263 3.07121 0.708378 3.05842 0.889959 3.23058L2.88601 5.12314L7.23994 0.169529C7.40514 -0.0184162 7.68625 -0.0312084 7.86783 0.140957Z" fill="white"/>
        </svg>
      </div>
      ${getEyebrow(index)}
      <span class="title">${text}</span>
    `;
}

function getEyebrow(index) {
  const counter = (index + 1).toString().padStart(2, '0');
  return `
      <span class="eyebrow">
        <span class="counter" aria-hidden="true">${counter}</span>
        ${numberWords[index] ? `Step ${numberWords[index]}` : `Step ${index + 1}`}
      </span>
    `;
}

function handleSubmit(e) {
  e.preventDefault();
  const form = document.querySelector('form');

  if (!form.reportValidity()) {
    return;
  }

  const input = document.querySelector('input');
  const list = document.querySelector('.progress');
  const newItem = document.createElement('li');

  if (list.lastElementChild.dataset.state === 'previous') {
    newItem.dataset.state = 'current';
    newItem.setAttribute('aria-current', 'step');
  } else {
    newItem.dataset.state = 'upcoming';
  }

  newItem.innerHTML = getListItemContents(input.value, list.children.length);
  list.appendChild(newItem);
  newItem.scrollIntoView();
}

function increment() {
  const current = document.querySelector('.progress li[aria-current="step"]');
  // fallback for when all items are previous
  const nextItem = current
    ? current.nextElementSibling
    : document.querySelector('.progress li[data-state="upcoming"]:first-child');

  if (current) {
    current.removeAttribute('aria-current');
    current.dataset.state = 'previous';
  }
  if (nextItem) {
    nextItem.setAttribute('aria-current', 'step');
    nextItem.dataset.state = 'current';
  }
}

function decrement() {
  const current = document.querySelector('.progress li[aria-current="step"]');
  // fallback for when all items are upcoming
  const previousItem = current
    ? current.previousElementSibling
    : document.querySelector('.progress li[data-state="previous"]:last-child');
  if (current) {
    current.removeAttribute('aria-current');
    current.dataset.state = 'upcoming';
  }
  if (previousItem) {
    previousItem.setAttribute('aria-current', 'step');
    previousItem.dataset.state = 'current';
  }
}

function initForm() {
  const button = document.querySelector('button');
  button.addEventListener('click', handleSubmit);
  const form = document.querySelector('form');
  form.addEventListener('submit', handleSubmit);
  const incrementButton = document.querySelector('button#increment');
  incrementButton.addEventListener('click', increment);
  const decrementButton = document.querySelector('button#decrement');
  decrementButton.addEventListener('click', decrement);
  const deleteButton = document.querySelector('button#delete');
  deleteButton.addEventListener('click', () => form.remove());
}

initProgressList();
initForm();

import { $, toast } from './utils.js';
import { storage } from './storage.js';

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The secret of your success is determined by your daily agenda.", author: "John C. Maxwell" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Rohn" },
  { text: "The more I want to get something done, the less I call it work.", author: "Richard Bach" },
  { text: "Excellence is not a destination but a continuous journey that never ends.", author: "Brian Tracy" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
];

let currentIndex = -1;

export function initQuotes() {
  loadQuote();
  $('#quote-refresh')?.addEventListener('click', () => refreshQuote());
}

function loadQuote() {
  const saved = storage.get('quote_index', -1);
  const savedDate = storage.get('quote_date', '');
  const today = new Date().toDateString();

  if (savedDate === today && saved >= 0) {
    currentIndex = saved;
  } else {
    currentIndex = Math.floor(Math.random() * QUOTES.length);
    storage.set('quote_index', currentIndex);
    storage.set('quote_date', today);
  }

  displayQuote(QUOTES[currentIndex]);
}

function refreshQuote() {
  const contentEl = $('#quote-content');
  if (contentEl) {
    contentEl.classList.add('fading');
    setTimeout(() => {
      let next = Math.floor(Math.random() * QUOTES.length);
      while (next === currentIndex && QUOTES.length > 1) {
        next = Math.floor(Math.random() * QUOTES.length);
      }
      currentIndex = next;
      storage.set('quote_index', currentIndex);
      displayQuote(QUOTES[currentIndex]);
      contentEl.classList.remove('fading');
      contentEl.style.animation = 'none';
      void contentEl.offsetWidth;
      contentEl.style.animation = 'quote-fade-in 400ms var(--ease-smooth) both';
    }, 250);
  }
}

function displayQuote(quote) {
  const textEl   = $('#quote-text');
  const authorEl = $('#quote-author');
  if (textEl)   textEl.textContent   = `"${quote.text}"`;
  if (authorEl) authorEl.textContent = `— ${quote.author}`;
}

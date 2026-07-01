import { $ } from './utils.js';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let current = new Date();

export function initCalendar() {
  render();
  $('#cal-prev')?.addEventListener('click', () => { current.setMonth(current.getMonth() - 1); render(); });
  $('#cal-next')?.addEventListener('click', () => { current.setMonth(current.getMonth() + 1); render(); });
}

function render() {
  const monthLabel = $('#cal-month-year');
  if (monthLabel) monthLabel.textContent = `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;

  const grid = $('#cal-days');
  if (!grid) return;
  grid.innerHTML = '';

  const today     = new Date();
  const firstDay  = new Date(current.getFullYear(), current.getMonth(), 1);
  const lastDay   = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startPad  = firstDay.getDay();

  /* Previous month trailing days */
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - i - 1);
    grid.appendChild(dayCell(d, true, today));
  }

  /* Current month */
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(current.getFullYear(), current.getMonth(), d);
    grid.appendChild(dayCell(date, false, today));
  }

  /* Next month leading days to fill grid */
  const total = startPad + lastDay.getDate();
  const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remainder; i++) {
    const d = new Date(lastDay);
    d.setDate(d.getDate() + i);
    grid.appendChild(dayCell(d, true, today));
  }
}

function dayCell(date, otherMonth, today) {
  const cell = document.createElement('div');
  const isToday = date.toDateString() === today.toDateString();
  cell.className = 'calendar-day' +
    (otherMonth ? ' other-month' : '') +
    (isToday ? ' today' : '');
  cell.textContent = date.getDate();
  cell.setAttribute('aria-label', date.toLocaleDateString());
  cell.addEventListener('click', () => {
    document.querySelectorAll('.calendar-day.selected').forEach(c => c.classList.remove('selected'));
    if (!isToday) cell.classList.add('selected');
  });
  return cell;
}

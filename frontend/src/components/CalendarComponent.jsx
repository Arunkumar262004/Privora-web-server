import React, { useState, useEffect } from 'react';

const CalendarComponent = ({ selectedDate, onSelectDate, transactions, notes, currentMonth, setCurrentMonth }) => {
  const [days, setDays] = useState([]);

  // Navigate months
  const prevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${yStr}-${mStr}`);
  };

  const nextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${yStr}-${mStr}`);
  };

  useEffect(() => {
    generateCalendar();
  }, [currentMonth, transactions, notes, selectedDate]);

  const generateCalendar = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    // 0-indexed month for Date
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const calendarDays = [];

    // Fill in empty slots before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push({ type: 'empty', id: `empty-${i}` });
    }

    // Fill in days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if there are transactions or notes on this date
      const dateTx = transactions.filter(t => t.date === dateString);
      const dateNote = notes.find(n => n.date === dateString);

      const hasCredit = dateTx.some(t => t.type === 'credit');
      const hasDebit = dateTx.some(t => t.type === 'debit');

      calendarDays.push({
        type: 'day',
        day,
        dateString,
        hasCredit,
        hasDebit,
        note: dateNote,
        transactions: dateTx
      });
    }

    setDays(calendarDays);
  };

  const getMonthName = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-panel calendar-section" style={{ padding: '24px' }}>
      <div className="calendar-header">
        <h2 className="calendar-title">🗓️ {getMonthName(currentMonth)}</h2>
        <div className="month-nav">
          <button className="btn-nav" onClick={prevMonth}>&lt; Prev</button>
          <button className="btn-nav" onClick={nextMonth}>Next &gt;</button>
        </div>
      </div>

      <div className="calendar-grid">
        {dayHeaders.map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}

        {days.map((item, index) => {
          if (item.type === 'empty') {
            return <div key={item.id} className="calendar-day empty"></div>;
          }

          const isSelected = item.dateString === selectedDate;

          return (
            <div
              key={item.dateString}
              className={`calendar-day ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDate(item.dateString)}
            >
              <div className="day-number">{item.day}</div>
              
              <div className="day-events">
                {/* Dots indicators */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {item.hasCredit && <span className="dot-indicator dot-credit" title="Has Credit"></span>}
                  {item.hasDebit && <span className="dot-indicator dot-debit" title="Has Debit"></span>}
                  {item.note && <span className="dot-indicator dot-note" title="Has Note"></span>}
                </div>

                {/* Micro-preview of note title */}
                {item.note && (
                  <div className="day-preview-text">
                    📝 {item.note.title}
                  </div>
                )}

                {/* Micro-preview of transaction count */}
                {item.transactions.length > 0 && !item.note && (
                  <div className="day-preview-text">
                    💸 {item.transactions.length} txs
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarComponent;

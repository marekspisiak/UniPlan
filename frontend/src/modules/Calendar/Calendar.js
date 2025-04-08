import { Card } from 'react-bootstrap';
import './Calendar.scss';

const Calendar = () => {
  return (
    <Card className="calendar">
      <Card.Body>
        <h5 className="calendar__title">Kalendár</h5>
        <div className="calendar__grid">
          {/* Dummy statický obsah (dni v týždni + čísla) */}
          <div className="calendar__weekdays">
            {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map((day, i) => (
              <div key={i} className="calendar__day">{day}</div>
            ))}
          </div>
          <div className="calendar__dates">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="calendar__date">{i + 1}</div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Calendar;

import React from 'react';
import MainLayout from './MainLayout';

const sections = [
  { title: 'Everyday / On-Campus (2 points)', color: 'bg-pink-100', items: [
    'Dining hall meal',
    'Dorm/apartment hangout',
    'Anh/Chị–Em coffee or hangout',
    'Lawns/Steps hangout',
    'Study Session',
    'Workout Together',
    'Cafe Hang-Out (On campus: Joes, Cafe East, Lizs, etc.)',
  ]},
  { title: 'On-Campus Involvement (3 points)', color: 'bg-rose-200', items: [
    'Attend VSA Event together (GBM, mixers)',
    'Group study session',
    'Attend another Columbia org event',
    'Volunteer/tabling on campus',
    'Workshop/Performance',
    'Movie Night',
  ]},
  { title: 'Near Campus (5 points)', color: 'bg-amber-200', items: [
    'Game night (Hex & Co)',
    'Movie Theaters / Outdoor Movie Theaters',
    'Arts & crafts night',
    'Farmers market / neighborhood stroll',
    'Grocery run together (with shared activity)',
    'Cafe Hang-Out (Off campus)',
  ]},
  { title: 'City Outings (7 points)', color: 'bg-yellow-200', items: [
    'Dinner/dessert downtown (Chinatown, K-town, etc.)',
    'Museum visit (Met/MoMA/AMNH)',
    'Picnic (Central Park/Roosevelt/Riverside)',
    'Karaoke night (booked room)',
    'NYC festival or night market',
    'Neighborhood explore (SoHo, DUMBO, Flushing)',
    'Go to New Jersey',
  ]},
  { title: 'Cultural / Major Events (10 points)', color: 'bg-green-200', items: [
    'Cook or bake together',
    'Attend WEAI/EALAC/Cô Chung events',
    'Vietnam Consulate Tết Party',
    'Perform/MC/organize a cultural show',
    'Charity/volunteering together',
    'Plan & host a VSA family event',
    'Host Vietnamese dinner/potluck',
  ]},
  { title: 'Trips & Big Adventures (13 points)', color: 'bg-sky-200', items: [
    'Upstate / Rockaway / Bear Mountain day trip',
    'Out-of-state trip (excl. NJ)',
    'Apple/pumpkin picking',
    'Beach day or amusement park',
    'Concert / festival / Broadway',
    'Overnight trip or retreat',
  ]},
];

const bonus = [
  'Birthday celebration',
  'Homemade food',
  'Cultural holiday (Tết/Mid-Autumn)',
  'Grad photos together',
  'Performance/competition',
  'Unique event (eclipse/art show)',
  'Viet-themed (+3) — exclusive',
];

export default function PointsChart() {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-[#b32a2a] mb-4">VSA Points Chart</h1>
        <p className="text-sm text-gray-600 mb-6">
          Attendance rules: 2 members max 2 points; 3–7 point events need ≥3 members; if 3 members attend a 10–13 point event, max 7 points; 10–13 point events require ≥4 members for full points.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((sec) => (
            <div key={sec.title} className={`rounded-lg border border-gray-200 ${sec.color} p-4`}>
              <h2 className="font-semibold mb-2">{sec.title}</h2>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                {sec.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <h3 className="font-semibold mb-2">Bonus Tags (+1 each; cap +3)</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {bonus.map(b => <li key={b}>{b}</li>)}
          </ul>
          <p className="text-xs text-gray-600 mt-2">Viet-themed (+3) is exclusive and cannot be combined.</p>
        </div>
      </div>
    </MainLayout>
  );
}



import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { byId, directionsUrl, type LocationId } from '../data/locations';
import { toast } from '../data/site';

type Choice = { label: string; fm306: number; gruene: number };
type Question = { question: string; choices: Choice[] };

const questions: Question[] = [
  { question: 'How are you rolling?', choices: [
    { label: 'Drive-thru', fm306: 3, gruene: 0 }, { label: 'Order ahead', fm306: 3, gruene: 0 }, { label: 'Stay a while', fm306: 0, gruene: 3 },
  ] },
  { question: 'What are you craving?', choices: [
    { label: 'Frozen daiquiris', fm306: 2, gruene: 1 }, { label: 'Coffee, boba or matcha', fm306: 3, gruene: 0 }, { label: 'Beer or wine', fm306: 0, gruene: 3 }, { label: 'Dirty soda', fm306: 1, gruene: 1 },
  ] },
  { question: 'What’s the plan?', choices: [
    { label: 'River or lake', fm306: 2, gruene: 0 }, { label: 'Live music or the game', fm306: 0, gruene: 3 }, { label: 'Morning pick-me-up', fm306: 3, gruene: 0 }, { label: 'Exploring Gruene', fm306: 0, gruene: 3 }, { label: 'Party at home', fm306: 2, gruene: 0 },
  ] },
];

const reasons: Record<LocationId, string[]> = {
  fm306: ['It has drive-thru, curbside pickup, and Toast ordering.', 'Sip Society serves coffee, espresso, matcha, boba, dirty sodas, and smoothies.', 'It opens at 9 AM and offers gallons, River Jugs, and party favors.'],
  gruene: ['It is a turf-lawn hideaway in the Gruene Historic District.', 'The Backyard has live music and games on its big screens.', 'It pours frozen daiquiris, beer, wine, dirty sodas, plus small bites and treats.'],
};

export function Quiz() {
  const [answers, setAnswers] = useState<(Choice | undefined)[]>([]);
  const complete = answers.length === questions.length;
  const scores = useMemo(() => answers.reduce((result, answer) => ({ fm306: result.fm306 + (answer?.fm306 ?? 0), gruene: result.gruene + (answer?.gruene ?? 0) }), { fm306: 0, gruene: 0 }), [answers]);
  const winner = scores.fm306 === scores.gruene ? undefined : (scores.fm306 > scores.gruene ? 'fm306' : 'gruene');
  const resultLocation = winner ? byId(winner) : undefined;

  const choose = (choice: Choice) => setAnswers((current) => [...current, choice]);
  const restart = () => setAnswers([]);

  return (
    <section id="choose" className="quiz-section section-pad" aria-labelledby="choose-heading">
      <div className="shell">
        <div className="section-heading centered">
          <p className="eyebrow">Quick matchmaker</p>
          <h2 id="choose-heading">Your next stop, sorted.</h2>
          <p>Three questions. One good call.</p>
        </div>
        {!complete ? (
          <div className="quiz-card">
            <p className="quiz-count">Question {answers.length + 1} of {questions.length}</p>
            <h3>{questions[answers.length].question}</h3>
            <div className="answer-grid">
              {questions[answers.length].choices.map((choice) => <button key={choice.label} className="answer-button" onClick={() => choose(choice)}>{choice.label}<ArrowRight size={18} /></button>)}
            </div>
          </div>
        ) : (
          <div className="quiz-result" aria-live="polite">
            <Sparkles className="result-sparkle" aria-hidden="true" />
            {resultLocation ? <>
              <p className="eyebrow">Your match</p>
              <h3>{resultLocation.name}</h3>
              <p className="result-lead">{resultLocation.bestFor}</p>
              <ul>{reasons[resultLocation.id].map((reason) => <li key={reason}>{reason}</li>)}</ul>
              <div className="result-actions">
                {resultLocation.id === 'fm306' ? <a className="button button-coral" href={toast.orderUrl} target="_blank" rel="noreferrer">Order ahead ↗</a> : <a className="button button-yard" href={directionsUrl(resultLocation)} target="_blank" rel="noreferrer">Get directions ↗</a>}
                <a className="text-link" href="#visit">See visit details <span>→</span></a>
              </div>
            </> : <>
              <p className="eyebrow">It’s a tie</p>
              <h3>Choose the kind of hang you want.</h3>
              <p className="result-lead">The Depot is set up for drive-thru and ordering ahead; The Backyard is the stay-a-while Gruene option.</p>
              <div className="result-actions"><a className="button button-coral" href="#locations">Compare locations</a></div>
            </>}
            <button className="restart-button" onClick={restart}><RotateCcw size={16} /> Start over</button>
          </div>
        )}
      </div>
    </section>
  );
}

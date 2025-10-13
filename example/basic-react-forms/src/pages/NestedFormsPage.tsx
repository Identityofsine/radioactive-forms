import React from 'react';
import { useForm, formGroup, Form } from '@radioactive/forms';
import ShowFormStateButton from '../components/ShowFormStateButton';

type Player = { name: string; score: number };
type Team = { name: string; captain: Player; roster: Array<Form<Player>> };
type League = { season: string; teams: Array<Form<Team>> };

export const NestedFormsPage: React.FC = () => {
  const { form } = useForm<League>({
    season: ['2025'],
    teams: [
      formGroup<Team>({
        name: 'Alpha',
        captain: { name: 'Alice', score: 10 },
        roster: [
          formGroup<Player>({ name: 'Bob', score: 5 }),
          formGroup<Player>({ name: 'Cara', score: 7 }),
        ],
      }),
      formGroup<Team>({
        name: 'Beta',
        captain: { name: 'Ben', score: 12 },
        roster: [
          formGroup<Player>({ name: 'Dee', score: 6 }),
        ],
      }),
    ],
  });

  const controls = (form as unknown as { controls: Record<string, any> })?.controls;

  function addTeam() {
    if (!form) return;
    const teamsCtrl = form.getControl('teams');
    if (!teamsCtrl) return;
    const arr = teamsCtrl.value;
    arr.push(
      formGroup<Team>({ name: `New ${arr.length + 1}`, captain: { name: 'New Cap', score: 0 }, roster: [] })
    );
    teamsCtrl.value = arr.slice();
  }

  function addPlayer(teamIndex: number) {
    if (!form) return;
    const teamsCtrl = form.getControl('teams');
    if (!teamsCtrl) return;
    const teamForm = teamsCtrl.value[teamIndex];
    const rosterCtrl = teamForm.getControl('roster');
    const arr = rosterCtrl?.value ?? [];
    arr.push(formGroup<Player>({ name: 'Rookie', score: 0 }));
    if (rosterCtrl) rosterCtrl.value = arr.slice();
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ minWidth: 480 }}>
        <h2>Nested Forms - League</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <label>
            Season
            <input
              data-testid="season"
              value={String(controls?.season.value ?? '')}
              onChange={(e) => controls?.season && (controls.season.value = e.currentTarget.value)}
            />
          </label>

          <button data-testid="add-team" onClick={addTeam}>Add Team</button>

          <div>
            {(controls?.teams.value ?? []).map((teamForm: Form<Team>, idx: number) => (
              <fieldset key={idx} style={{ marginTop: 12 }}>
                <legend>Team {idx + 1}</legend>
                <label>
                  Name
                  <input
                    value={String((teamForm as any).controls.name.value)}
                    onChange={(e) => (teamForm as any).controls.name.value = e.currentTarget.value}
                  />
                </label>
                <fieldset style={{ marginTop: 8 }}>
                  <legend>Captain</legend>
                  <label>
                    Name
                    <input
                      value={String((teamForm as any).controls.captain.value.controls.name.value)}
                      onChange={(e) => (teamForm as any).controls.captain.value.controls.name.value = e.currentTarget.value}
                    />
                  </label>
                  <label>
                    Score
                    <input
                      type="number"
                      value={String((teamForm as any).controls.captain.value.controls.score.value)}
                      onChange={(e) => (teamForm as any).controls.captain.value.controls.score.value = Number(e.currentTarget.value)}
                    />
                  </label>
                </fieldset>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => addPlayer(idx)} data-testid={`add-player-${idx}`}>Add Player</button>
                  <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    {(teamForm.getControl('roster')?.value ?? []).map((playerForm: Form<Player>, pIdx: number) => (
                      <div key={pIdx}>
                        <input
                          value={String((playerForm as any).controls.name.value)}
                          onChange={(e) => (playerForm as any).controls.name.value = e.currentTarget.value}
                        />
                        <input
                          type="number"
                          value={String((playerForm as any).controls.score.value)}
                          onChange={(e) => (playerForm as any).controls.score.value = Number(e.currentTarget.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button data-testid="toggle-readonly" onClick={() => { if (form) form.readonly = !form.readonly; }}>Toggle Readonly</button>
            <button data-testid="reset" onClick={() => form?.reset()}>Reset</button>
          </div>
          <div>
            {form?.readonly ? 'Readonly' : 'Editable'} | {form?.dirty ? 'Dirty' : 'Pristine'}
          </div>
        </div>
      </div>
      <ShowFormStateButton form={form} />
    </div>
  );
};

export default NestedFormsPage;




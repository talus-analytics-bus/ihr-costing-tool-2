// Iterate over jee_costing_data-fr.json and translate remaining non-French into French
const ceHash = {"Prevent":"Prévenir","Detect":"Détecter","Respond":"Riposter"};
jee_costing_data.forEach(ce => {
	ce.name = ceHash[ce.name];
	ce.forEach(cc => {
		const cc_fr = core_capacities.find(d => d.id === cc.id).fr;
		cc.name = cc_fr.name;
		cc.target_description = cc_fr.target_description;
		cc.desired_impact = cc_fr.desired_impact;
		cc.notes = cc_fr.notes;
		cc.as_measured_by = ''; // not translated, but also not essential
		cc.forEach(ind => {
			const ind_fr = indicators.find(d => d.id === ind.id);
			ind.name = ind_fr.fr;
			ind.score_descriptions = {};
			ind.score_descriptions = ind_fr.score_descriptions.map(score_desc_fr => {
				ind.score_descriptions[score_desc_fr.score] = score_desc_fr.fr;
			});
		});
	});
});

<!-- The footer: what the site keeps, its sources, its code. -->
<script>
	import { L } from '$lib/i18n/fr.js';
	const S = L.footSourceItems;
	const ext = { target: '_blank', rel: 'noopener noreferrer' };
</script>

<footer class="site">
	<div class="cols">
		<div>
			<h2>{L.footPrivacy}</h2>
			<p>{L.footPrivacyServer}</p>
		</div>
		<div>
			<h2>{L.footSources}</h2>
			<ul>
				<li><a href="https://politiscales.fr" {...ext}>PolitiScales</a> — {S.politiscales}</li>
				<li><a href="https://www.chesdata.eu/ches-europe/" {...ext}>Chapel Hill Expert Survey 2024</a> — {S.ches}</li>
				<li>
					<a href="https://www.europeansocialsurvey.org/" {...ext}>ESS</a>,
					<a href="https://issp.org/" {...ext}>ISSP</a>,
					<a href="https://europeanvaluesstudy.eu/" {...ext}>EVS</a> — {S.surveys}
				</li>
				<li>Erik Olin Wright, <em>Class Counts</em> — {S.wright}</li>
				<li>
					<a href="https://game-icons.net/" {...ext}>game-icons.net</a> (Lorc, Delapouite),
					<a href="https://creativecommons.org/licenses/by/3.0/" {...ext}>CC BY 3.0</a> — {S.icons}
				</li>
			</ul>
		</div>
		<div>
			<h2>{L.footCode}</h2>
			<ul>
				<li><a href="https://github.com/BenPali/politiskel" {...ext}>github.com/BenPali/politiskel</a></li>
				<li>{L.footLicence}</li>
				<li><a href="/methode">{L.navMethod}</a> · <a href="/drapeaux">{L.navFlags}</a></li>
			</ul>
		</div>
	</div>
	<p class="fine">{L.footFine}</p>
</footer>

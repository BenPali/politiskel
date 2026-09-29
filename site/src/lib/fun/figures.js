/* Historical figures for the "Pour rire" page, and nothing else.

   There is no survey of the dead. Every position below is a hand estimate,
   made by us from what the person wrote, did or campaigned for, on a scale
   built for living parties (the CHES scale the compass uses). Those people
   did not think in our categories, and a position placed "today" is a
   reading of their documented stances, not relative to their own time. The
   page says so; this file keeps the trace so that a reader can check it.

   Nothing here feeds a reading of the compass: not the serious party
   comparison, not the badges, not the passport, not a group's aggregate.

   Fields
     id, name, born, died   died is required: only the dead are listed.
     x                      economy, [-100, 100]: -100 the state owns and
                            redistributes, +100 the market decides.
     y                      society, [-100, 100]: -100 libertarian (in the
                            CHES sense: open, postmaterialist), +100
                            authoritarian and traditional (GAL/TAN).
     readings               secondary readings, only where a documented
                            stance supports them, otherwise absent (null,
                            and ignored in matching). Same keys, same
                            direction as the questionnaire's readings in
                            compass/model.js:
                              europe    +100 for European integration
                              pacifism  +100 pacifist, -100 militarist
                              populism  +100 the people against the elites
                              ecology   +100 the environment first
                            Other readings (nuclear, degrowth, Russia...)
                            would be anachronisms for nearly everyone and are
                            not carried.
     confidence             high: both axes rest on a documented programme
                            or self-description. medium: one does, the other
                            is a reasoned reading. low: both are inferred,
                            or the person's categories are far from ours.
     wiki                   title of the English Wikipedia article, the
                            pointer to what the estimate rests on.
     basis                  one sentence, in English: what each coordinate
                            rests on. A secondary reading must be named in
                            it (tools/fun-check.js enforces that).

   Who is not here, and why: nobody living; nobody who founded or ran a
   regime or an apparatus responsible for genocide, mass killing or a
   man-made famine (hundreds of thousands of victims), so nobody who could be
   announced to a player as "you are" that person; nobody known chiefly for
   hatred. The rule is written out in the commit that adds this file. */

const FIGURES_DATA = [
	{
		id: 'adam-smith', name: 'Adam Smith', born: 1723, died: 1790, x: 45, y: -15, confidence: 'medium', wiki: 'Adam Smith',
		basis: 'Economy: The Wealth of Nations argues for free trade and against monopolies yet accepts public schooling and taxes proportional to income; society: he condemned slavery and colonial monopolies but wrote before any modern cultural question.'
	},
	{
		id: 'voltaire', name: 'Voltaire', born: 1694, died: 1778, x: 25, y: -55, confidence: 'medium', wiki: 'Voltaire',
		basis: 'Economy: he defended commerce and luxury and backed an enlightened monarch, with no redistribution to speak of; society: the Treatise on Tolerance and the Calas affair against religious persecution, though the article records antisemitic passages.'
	},
	{
		id: 'rousseau', name: 'Jean-Jacques Rousseau', born: 1712, died: 1778, x: -50, y: 30, readings: { populism: 55 }, confidence: 'medium', wiki: 'Jean-Jacques Rousseau',
		basis: 'Economy: the Discourse on Inequality and The Social Contract want no citizen rich enough to buy another; society: a civil religion imposed by the state and a conventional view of women in Emile; populism: sovereignty belongs to the general will of the people.'
	},
	{
		id: 'burke', name: 'Edmund Burke', born: 1729, died: 1797, x: 45, y: 65, readings: { populism: -85 }, confidence: 'medium', wiki: 'Edmund Burke',
		basis: 'Economy: Thoughts and Details on Scarcity defends free trade in grain; society: Reflections on the Revolution in France defends inherited institutions, religion and order; populism: he told the electors of Bristol that an MP owes them judgement, not obedience.'
	},
	{
		id: 'paine', name: 'Thomas Paine', born: 1737, died: 1809, x: -35, y: -70, confidence: 'high', wiki: 'Thomas Paine',
		basis: 'Economy: Rights of Man and Agrarian Justice propose progressive taxes, pensions and a capital grant at 21; society: a republican and deist who attacked slavery, hereditary rank and organised religion.'
	},
	{
		id: 'wollstonecraft', name: 'Mary Wollstonecraft', born: 1759, died: 1797, x: -20, y: -85, confidence: 'medium', wiki: 'Mary Wollstonecraft',
		basis: 'Society: A Vindication of the Rights of Woman demands equal education and civil standing for women; economy is a reasoned guess from her attack on hereditary property in A Vindication of the Rights of Men.'
	},
	{
		id: 'condorcet', name: 'Nicolas de Condorcet', born: 1743, died: 1794, x: 20, y: -85, confidence: 'medium', wiki: 'Nicolas de Condorcet',
		basis: 'Society: he argued for women\'s citizenship, against slavery and against the death penalty; economy: a free-trade physiocrat who nonetheless drafted public schooling and old-age insurance schemes.'
	},
	{
		id: 'de-gouges', name: 'Olympe de Gouges', born: 1748, died: 1793, x: -20, y: -90, confidence: 'medium', wiki: 'Olympe de Gouges',
		basis: 'Society: the 1791 Declaration of the Rights of Woman, her abolitionist play Zamore et Mirza and her calls for divorce; economy is a weak guess from her calls for public relief of the poor.'
	},
	{
		id: 'bentham', name: 'Jeremy Bentham', born: 1748, died: 1832, x: 25, y: -75, confidence: 'medium', wiki: 'Jeremy Bentham',
		basis: 'Economy: he defended free lending at interest yet wrote schemes for state poor relief; society: he argued for women\'s equality, animal welfare and the decriminalisation of homosexuality, and designed the Panopticon prison.'
	},
	{
		id: 'de-maistre', name: 'Joseph de Maistre', born: 1753, died: 1821, x: 20, y: 95, readings: { populism: -95 }, confidence: 'medium', wiki: 'Joseph de Maistre',
		basis: 'Society: Considerations on France and the Saint Petersburg Dialogues defend throne, altar and the executioner against revolution; economy has no programme and is placed at a paternalist centre-right; populism: he rejects popular sovereignty outright.'
	},
	{
		id: 'metternich', name: 'Klemens von Metternich', born: 1773, died: 1859, x: 30, y: 90, readings: { populism: -90 }, confidence: 'medium', wiki: 'Klemens von Metternich',
		basis: 'Society: the Carlsbad Decrees, censorship and a police network against liberal and national movements; economy is a reasoned guess from a cautious, paternalist Habsburg administration; populism: he fought every claim of popular sovereignty.'
	},
	{
		id: 'tocqueville', name: 'Alexis de Tocqueville', born: 1805, died: 1859, x: 40, y: 5, readings: { populism: -55 }, confidence: 'medium', wiki: 'Alexis de Tocqueville',
		basis: 'Economy: in 1848 he spoke against the right to work and against socialism; society: Democracy in America praises liberty and religion and he opposed slavery, yet he defended the conquest of Algeria; populism: he feared the tyranny of the majority.'
	},
	{
		id: 'mill', name: 'John Stuart Mill', born: 1806, died: 1873, x: -5, y: -85, readings: { populism: -60 }, confidence: 'high', wiki: 'John Stuart Mill',
		basis: 'Economy: Principles of Political Economy favours markets but also cooperatives, land taxes and limits on inheritance; society: On Liberty and The Subjection of Women, and he moved women\'s suffrage in Parliament in 1867; populism: Considerations on Representative Government fears the mediocrity of the majority and proposes plural voting.'
	},
	{
		id: 'bastiat', name: 'Frédéric Bastiat', born: 1801, died: 1850, x: 95, y: -25, confidence: 'medium', wiki: 'Frédéric Bastiat',
		basis: 'Economy: Economic Sophisms and The Law attack tariffs and every state privilege; society: he opposed slavery and privilege but wrote little on cultural questions, so this is a reasoned guess.'
	},
	{
		id: 'cobden', name: 'Richard Cobden', born: 1804, died: 1865, x: 90, y: -45, readings: { pacifism: 85 }, confidence: 'medium', wiki: 'Richard Cobden',
		basis: 'Economy: he led the Anti-Corn Law League for free trade and opposed legal limits on working hours; society is a reasoned guess from his campaigns for schooling and against imperial expansion; pacifism: he addressed the peace congresses and opposed the Crimean War.'
	},
	{
		id: 'gladstone', name: 'William Ewart Gladstone', born: 1809, died: 1898, x: 55, y: -5, confidence: 'medium', wiki: 'William Ewart Gladstone',
		basis: 'Economy: budgets of free trade and retrenchment; society: Irish Home Rule and the Midlothian campaign against the Bulgarian atrocities, set against a devout Anglican and an occupation of Egypt.'
	},
	{
		id: 'disraeli', name: 'Benjamin Disraeli', born: 1804, died: 1881, x: 5, y: 50, confidence: 'medium', wiki: 'Benjamin Disraeli',
		basis: 'Economy: One Nation Conservatism, with the Public Health Act 1875 and laws legalising trade unions; society: Empress of India, defence of Church and monarchy, though he backed Jewish emancipation.'
	},
	{
		id: 'bismarck', name: 'Otto von Bismarck', born: 1815, died: 1898, x: 10, y: 65, confidence: 'high', wiki: 'Otto von Bismarck',
		basis: 'Economy: the first state health and pension insurance in the 1880s, and protective tariffs from 1879; society: the Kulturkampf against the Catholic Church and the Anti-Socialist Laws.'
	},
	{
		id: 'mazzini', name: 'Giuseppe Mazzini', born: 1805, died: 1872, x: -25, y: -10, readings: { europe: 75 }, confidence: 'medium', wiki: 'Giuseppe Mazzini',
		basis: 'Economy: The Duties of Man backs workers\' associations and rejects both laissez-faire and communism; society: a republican democrat who wanted women\'s equality but wrote in the name of God and the nation; Europe: he founded Young Europe as a league of national republics.'
	},
	{
		id: 'lincoln', name: 'Abraham Lincoln', born: 1809, died: 1865, x: 30, y: -30, confidence: 'medium', wiki: 'Abraham Lincoln',
		basis: 'Economy: Whig protective tariffs, the Homestead Act, a national banking system and the transcontinental railroad; society: the Emancipation Proclamation and the 13th Amendment, though in 1858 he denied wanting full social equality.'
	},
	{
		id: 'douglass', name: 'Frederick Douglass', born: 1818, died: 1895, x: 5, y: -80, confidence: 'medium', wiki: 'Frederick Douglass',
		basis: 'Society: abolition, and he spoke at Seneca Falls for women\'s suffrage; economy is a weak guess from his support for free labour, schooling and the Freedman\'s Bank.'
	},
	{
		id: 'marx', name: 'Karl Marx', born: 1818, died: 1883, x: -95, y: -30, confidence: 'medium', wiki: 'Karl Marx',
		basis: 'Economy: The Communist Manifesto and Capital call for the abolition of private ownership of the means of production; society: internationalist and atheist, but he set out no cultural programme, so this is a reasoned reading.'
	},
	{
		id: 'proudhon', name: 'Pierre-Joseph Proudhon', born: 1809, died: 1865, x: -70, y: 35, confidence: 'medium', wiki: 'Pierre-Joseph Proudhon',
		basis: 'Economy: What Is Property? ("property is theft") yet a defence of small holdings and mutual credit; society: patriarchal and anti-feminist writings and antisemitic notebooks, while calling himself an anarchist.'
	},
	{
		id: 'bakunin', name: 'Mikhail Bakunin', born: 1814, died: 1876, x: -95, y: -65, confidence: 'medium', wiki: 'Mikhail Bakunin',
		basis: 'Economy: collectivist anarchism, ownership by workers\' associations; society: God and the State attacks church and authority, though he was a conspirator by taste and made antisemitic remarks about Marx.'
	},
	{
		id: 'kropotkin', name: 'Peter Kropotkin', born: 1842, died: 1921, x: -92, y: -78, confidence: 'high', wiki: 'Peter Kropotkin',
		basis: 'Economy: The Conquest of Bread sets out anarcho-communism, goods shared by the commune; society: Mutual Aid, Anarchist Morality and his prison writings reject authority, religious morality and punishment.'
	},
	{
		id: 'goldman', name: 'Emma Goldman', born: 1869, died: 1940, x: -90, y: -95, readings: { pacifism: 85 }, confidence: 'high', wiki: 'Emma Goldman',
		basis: 'Economy: an anarcho-communist against wage labour and the state; society: she lectured on birth control, free love and homosexuality; pacifism: she was jailed in 1917 for campaigning against conscription.'
	},
	{
		id: 'michel', name: 'Louise Michel', born: 1830, died: 1905, x: -88, y: -85, confidence: 'medium', wiki: 'Louise Michel',
		basis: 'Economy: she took part in the Paris Commune and later declared herself an anarchist; society: she taught girls and defended the Kanak revolt in New Caledonia, and we read the rest from her anarchism.'
	},
	{
		id: 'hugo', name: 'Victor Hugo', born: 1802, died: 1885, x: -25, y: -75, readings: { europe: 100, pacifism: 80 }, confidence: 'medium', wiki: 'Victor Hugo',
		basis: 'Economy: his 1849 speech on destitution and Les Misérables call for war on poverty, without breaking with private property; society: he campaigned against the death penalty and clericalism; Europe and pacifism: at the 1849 Peace Congress he called for the United States of Europe and the end of war.'
	},
	{
		id: 'jaures', name: 'Jean Jaurès', born: 1859, died: 1914, x: -65, y: -40, readings: { pacifism: 90 }, confidence: 'high', wiki: 'Jean Jaurès',
		basis: 'Economy: he unified French socialism around nationalisations and social laws; society: he defended Dreyfus and backed the 1905 secularism law; pacifism: he opposed the drift to war until his assassination in 1914.'
	},
	{
		id: 'luxemburg', name: 'Rosa Luxemburg', born: 1871, died: 1919, x: -92, y: -55, confidence: 'medium', wiki: 'Rosa Luxemburg',
		basis: 'Economy: Reform or Revolution and The Accumulation of Capital call for the overthrow of capitalism; society: "freedom is always the freedom of dissenters" and an internationalism against nationalism, on which we base a reasoned reading of her cultural position.'
	},
	{
		id: 'zetkin', name: 'Clara Zetkin', born: 1857, died: 1933, x: -90, y: -55, readings: { pacifism: 70 }, confidence: 'medium', wiki: 'Clara Zetkin',
		basis: 'Economy: a Marxist who led the socialist women\'s movement and later the German Communist Party; society: she proposed an International Women\'s Day in 1910; pacifism: she convened the 1915 women\'s conference against the war in Bern.'
	},
	{
		id: 'debs', name: 'Eugene V. Debs', born: 1855, died: 1926, x: -80, y: -45, readings: { pacifism: 90 }, confidence: 'medium', wiki: 'Eugene V. Debs',
		basis: 'Economy: five times the Socialist Party\'s presidential candidate and jailed after the Pullman strike; society is a reasoned reading of his party\'s platform of votes for women; pacifism: jailed in 1918 for an antiwar speech at Canton.'
	},
	{
		id: 'hardie', name: 'Keir Hardie', born: 1856, died: 1915, x: -65, y: -50, readings: { pacifism: 85 }, confidence: 'medium', wiki: 'Keir Hardie',
		basis: 'Economy: he founded the Independent Labour Party and the Labour Party on a programme of state pensions and public ownership; society: he backed women\'s suffrage; pacifism: he opposed British entry into the First World War.'
	},
	{
		id: 'blum', name: 'Léon Blum', born: 1872, died: 1950, x: -55, y: -45, confidence: 'medium', wiki: 'Léon Blum',
		basis: 'Economy: the 1936 Popular Front government brought the 40-hour week and paid holidays; society: the first Jewish and socialist prime minister of France, who wrote Du mariage (1907) in favour of freedom before marriage, and we read the rest from his republican humanism.'
	},
	{
		id: 'gramsci', name: 'Antonio Gramsci', born: 1891, died: 1937, x: -85, y: -25, confidence: 'medium', wiki: 'Antonio Gramsci',
		basis: 'Economy: a founder of the Italian Communist Party and theorist of workers\' councils; society is a reasoned reading of the Prison Notebooks, which stress culture and consent over force.'
	},
	{
		id: 'kollontai', name: 'Alexandra Kollontai', born: 1872, died: 1952, x: -92, y: -70, confidence: 'medium', wiki: 'Alexandra Kollontai',
		basis: 'Economy: a Bolshevik commissar for social welfare in 1917 who wanted collective childcare and communal housing; society: she wrote on free love and the liberation of women.'
	},
	{
		id: 'theodore-roosevelt', name: 'Theodore Roosevelt', born: 1858, died: 1919, x: -5, y: 35, readings: { pacifism: -70, ecology: 65 }, confidence: 'medium', wiki: 'Theodore Roosevelt',
		basis: 'Economy: the Square Deal and trust-busting; society: a nationalist and imperialist reformer who came to back women\'s suffrage; pacifism: the Big Stick policy; ecology: he protected some 230 million acres of public land.'
	},
	{
		id: 'bryan', name: 'William Jennings Bryan', born: 1860, died: 1925, x: -35, y: 40, readings: { populism: 90, pacifism: 80 }, confidence: 'medium', wiki: 'William Jennings Bryan',
		basis: 'Economy: the Cross of Gold speech against the gold standard and for an income tax; society: prohibition and the creationist side of the Scopes trial; populism: he ran as the champion of farmers against eastern bankers; pacifism: he resigned as Secretary of State in 1915 over the Lusitania notes.'
	},
	{
		id: 'clemenceau', name: 'Georges Clemenceau', born: 1841, died: 1929, x: 5, y: 25, confidence: 'low', wiki: 'Georges Clemenceau',
		basis: 'Society: Dreyfusard and anticlerical, but he opposed votes for women (1907) and sent troops against strikers as interior minister (1906); economy is a guess for a radical with no programme of his own.'
	},
	{
		id: 'fdr', name: 'Franklin D. Roosevelt', born: 1882, died: 1945, x: -50, y: 5, confidence: 'medium', wiki: 'Franklin D. Roosevelt',
		basis: 'Economy: the New Deal, the Social Security Act and the Wagner Act; society: he shelved anti-lynching bills to keep Southern Democrats and signed Executive Order 9066, the internment of Japanese Americans.'
	},
	{
		id: 'eleanor-roosevelt', name: 'Eleanor Roosevelt', born: 1884, died: 1962, x: -50, y: -65, confidence: 'medium', wiki: 'Eleanor Roosevelt',
		basis: 'Society: she chaired the drafting of the Universal Declaration of Human Rights and pressed for civil rights; economy is a reasoned reading of her support for the New Deal and for trade unions.'
	},
	{
		id: 'keynes', name: 'John Maynard Keynes', born: 1883, died: 1946, x: -20, y: -35, confidence: 'medium', wiki: 'John Maynard Keynes',
		basis: 'Economy: The General Theory calls for public investment and deficit spending in a slump while saving capitalism; society: Bloomsbury liberal, though he served the Eugenics Society.'
	},
	{
		id: 'russell', name: 'Bertrand Russell', born: 1872, died: 1970, x: -55, y: -90, readings: { pacifism: 90 }, confidence: 'high', wiki: 'Bertrand Russell',
		basis: 'Economy: guild socialism in Roads to Freedom; society: Marriage and Morals and Why I Am Not a Christian; pacifism: jailed in 1918 as a pacifist and later a leader of the nuclear disarmament movement.'
	},
	{
		id: 'einstein', name: 'Albert Einstein', born: 1879, died: 1955, x: -60, y: -70, readings: { pacifism: 65 }, confidence: 'medium', wiki: 'Albert Einstein',
		basis: 'Economy: his 1949 essay Why Socialism? favours planned production; society: he backed civil rights and spoke against racism in America; pacifism: a pacifist in the First World War who later signed the 1939 letter urging US research on the atomic bomb and the 1955 Russell-Einstein Manifesto.'
	},
	{
		id: 'orwell', name: 'George Orwell', born: 1903, died: 1950, x: -75, y: -5, confidence: 'medium', wiki: 'George Orwell',
		basis: 'Economy: he wrote that every line of serious work since 1936 was against totalitarianism and for democratic socialism; society: patriotic and wary of the progressive fashions of his circle, so we place him near the centre.'
	},
	{
		id: 'beauvoir', name: 'Simone de Beauvoir', born: 1908, died: 1986, x: -75, y: -90, confidence: 'high', wiki: 'Simone de Beauvoir',
		basis: 'Society: The Second Sex and the 1971 Manifesto of the 343 for abortion rights; economy: she called herself a socialist and backed the far left through the 1960s and 1970s.'
	},
	{
		id: 'sartre', name: 'Jean-Paul Sartre', born: 1905, died: 1980, x: -80, y: -65, confidence: 'medium', wiki: 'Jean-Paul Sartre',
		basis: 'Economy: he sided with the Communist Party and later the Maoists; society: he signed the Manifesto of the 121 for Algerian independence and refused the Nobel Prize.'
	},
	{
		id: 'camus', name: 'Albert Camus', born: 1913, died: 1960, x: -45, y: -55, readings: { pacifism: 55 }, confidence: 'medium', wiki: 'Albert Camus',
		basis: 'Economy: syndicalist sympathies and Combat editorials against both capitalism and Stalinism; society: Reflections on the Guillotine against the death penalty; pacifism: "Neither Victims nor Executioners" (1946), though on Algeria he sought a middle course that kept ties with France.'
	},
	{
		id: 'mendes-france', name: 'Pierre Mendès France', born: 1907, died: 1982, x: -20, y: -40, readings: { europe: -20, pacifism: 45 }, confidence: 'medium', wiki: 'Pierre Mendès France',
		basis: 'Economy: a modernising budget-minded radical who wanted planning and rigour; society is a reasoned reading of his Tunisian autonomy policy; Europe: he voted against the Treaty of Rome in 1957; pacifism: he ended the Indochina war in 1954.'
	},
	{
		id: 'de-gaulle', name: 'Charles de Gaulle', born: 1890, died: 1970, x: -10, y: 45, readings: { europe: 15 }, confidence: 'medium', wiki: 'Charles de Gaulle',
		basis: 'Economy: postwar nationalisations, planning and worker participation; society: national grandeur, a strong presidency and Catholic conservatism, tempered by ending the Algerian war; Europe: the Europe of nations and the 1965 empty chair crisis.'
	},
	{
		id: 'adenauer', name: 'Konrad Adenauer', born: 1876, died: 1967, x: 25, y: 45, readings: { europe: 90 }, confidence: 'medium', wiki: 'Konrad Adenauer',
		basis: 'Economy: he backed Erhard\'s social market economy and the 1957 pension reform; society: a Catholic conservative chancellor; Europe: the Schuman Plan and the Elysée Treaty.'
	},
	{
		id: 'erhard', name: 'Ludwig Erhard', born: 1897, died: 1977, x: 80, y: 25, confidence: 'medium', wiki: 'Ludwig Erhard',
		basis: 'Economy: he lifted price controls in 1948 and promoted "prosperity for all" through competition; society: a conservative CDU chancellor who called for a "formed society" in 1965.'
	},
	{
		id: 'monnet', name: 'Jean Monnet', born: 1888, died: 1979, x: 5, y: -10, readings: { europe: 100 }, confidence: 'low', wiki: 'Jean Monnet',
		basis: 'Economy: he ran the French Plan, indicative planning without nationalisation; society: a technocrat with no stated cultural position, left near the centre; Europe: the architect of the Schuman Plan.'
	},
	{
		id: 'spinelli', name: 'Altiero Spinelli', born: 1907, died: 1986, x: -30, y: -50, readings: { europe: 100 }, confidence: 'medium', wiki: 'Altiero Spinelli',
		basis: 'Economy: the 1941 Ventotene Manifesto asks for the nationalisation of monopolies; society is a reasoned reading of a confined anti-fascist federalist; Europe: he spent his life on a federal constitution for Europe.'
	},
	{
		id: 'brandt', name: 'Willy Brandt', born: 1913, died: 1992, x: -35, y: -35, readings: { europe: 75, pacifism: 55 }, confidence: 'medium', wiki: 'Willy Brandt',
		basis: 'Economy: a social-democratic chancellor who expanded the welfare state; society: the 1969 pledge to "dare more democracy" and the liberalisation of sexual criminal law; Europe: he backed enlargement of the Community; pacifism: Ostpolitik and the 1971 Nobel Peace Prize.'
	},
	{
		id: 'palme', name: 'Olof Palme', born: 1927, died: 1986, x: -50, y: -60, readings: { pacifism: 60 }, confidence: 'medium', wiki: 'Olof Palme',
		basis: 'Economy: he extended the Swedish welfare state and wage-earner funds; society: gender equality and openness to refugees; pacifism: he spoke against the Vietnam War and chaired a commission on disarmament.'
	},
	{
		id: 'attlee', name: 'Clement Attlee', born: 1883, died: 1967, x: -60, y: 5, confidence: 'high', wiki: 'Clement Attlee',
		basis: 'Economy: the NHS, and the nationalisation of coal, rail and the Bank of England between 1946 and 1948; society: Indian independence, but he kept the death penalty and did not reform the laws on homosexuality.'
	},
	{
		id: 'bevan', name: 'Aneurin Bevan', born: 1897, died: 1960, x: -75, y: -15, confidence: 'medium', wiki: 'Aneurin Bevan',
		basis: 'Economy: he founded the NHS and set out democratic socialism in In Place of Fear; society is a reasoned reading of an outspoken figure of the Labour left.'
	},
	{
		id: 'thatcher', name: 'Margaret Thatcher', born: 1925, died: 2013, x: 80, y: 55, readings: { europe: -35, pacifism: -60 }, confidence: 'high', wiki: 'Margaret Thatcher',
		basis: 'Economy: privatisations, union laws and cuts to the top tax rate; society: tough on crime and on immigration, and Section 28; Europe: the 1988 Bruges speech; pacifism: the Falklands War and the Trident programme.'
	},
	{
		id: 'benn', name: 'Tony Benn', born: 1925, died: 2014, x: -88, y: -35, readings: { europe: -70, pacifism: 75 }, confidence: 'medium', wiki: 'Tony Benn',
		basis: 'Economy: the Alternative Economic Strategy of 1970s Labour, with public ownership and import controls; society is a reasoned reading of a republican and civil libertarian; Europe: he led the "no" side in the 1975 referendum; pacifism: he was president of the Stop the War Coalition.'
	},
	{
		id: 'mitterrand', name: 'François Mitterrand', born: 1916, died: 1996, x: -50, y: -20, readings: { europe: 90 }, confidence: 'medium', wiki: 'François Mitterrand',
		basis: 'Economy: the 1981 nationalisations, then the 1983 turn to austerity; society: he abolished the death penalty in 1981 and decriminalised homosexuality in 1982, though as a minister he backed the war in Algeria; Europe: the Maastricht Treaty and the Franco-German axis.'
	},
	{
		id: 'kohl', name: 'Helmut Kohl', born: 1930, died: 2017, x: 35, y: 40, readings: { europe: 95 }, confidence: 'medium', wiki: 'Helmut Kohl',
		basis: 'Economy: a cautious CDU chancellor promising a "spiritual-moral turn" and restraint in welfare; society is a reasoned reading of a Catholic conservative; Europe: he drove the Maastricht Treaty and the euro.'
	},
	{
		id: 'gorbachev', name: 'Mikhail Gorbachev', born: 1931, died: 2022, x: -40, y: -15, readings: { europe: 60, pacifism: 65 }, confidence: 'medium', wiki: 'Mikhail Gorbachev',
		basis: 'Economy: perestroika allowed cooperatives and partial markets inside a socialist state; society: glasnost freed the press and released political prisoners, but he sent troops against unrest in Tbilisi, Baku and Vilnius; Europe: the "common European home"; pacifism: the 1987 INF Treaty and the 1990 Nobel Peace Prize.'
	},
	{
		id: 'havel', name: 'Václav Havel', born: 1936, died: 2011, x: 30, y: -45, confidence: 'medium', wiki: 'Václav Havel',
		basis: 'Society: The Power of the Powerless and Charter 77 defend individual conscience against the state; economy: as president he backed the market transition led by Václav Klaus but kept a moral distance from it.'
	},
	{
		id: 'sakharov', name: 'Andrei Sakharov', born: 1921, died: 1989, x: -10, y: -65, readings: { pacifism: 80 }, confidence: 'medium', wiki: 'Andrei Sakharov',
		basis: 'Economy: his 1968 essay argued for a convergence of socialism and capitalism; society: he defended dissidents and free expression; pacifism: he campaigned for a nuclear test ban and received the 1975 Nobel Peace Prize.'
	},
	{
		id: 'lee-kuan-yew', name: 'Lee Kuan Yew', born: 1923, died: 2015, x: 45, y: 80, confidence: 'medium', wiki: 'Lee Kuan Yew',
		basis: 'Economy: low taxes and free trade, alongside state-built housing and sovereign investment funds; society: caning, detention without trial under the Internal Security Act and press control.'
	},
	{
		id: 'reagan', name: 'Ronald Reagan', born: 1911, died: 2004, x: 75, y: 45, readings: { pacifism: -50 }, confidence: 'high', wiki: 'Ronald Reagan',
		basis: 'Economy: the 1981 tax cuts and deregulation; society: the war on drugs and appeals to traditional values; pacifism: the military build-up, tempered by the 1987 INF Treaty.'
	},
	{
		id: 'goldwater', name: 'Barry Goldwater', born: 1909, died: 1998, x: 88, y: 20, confidence: 'medium', wiki: 'Barry Goldwater',
		basis: 'Economy: The Conscience of a Conservative calls for a much smaller federal government; society: he voted against the 1964 Civil Rights Act, but later backed gay people serving in the military and abortion rights.'
	},
	{
		id: 'rand', name: 'Ayn Rand', born: 1905, died: 1982, x: 100, y: 5, confidence: 'medium', wiki: 'Ayn Rand',
		basis: 'Economy: Atlas Shrugged and Capitalism: The Unknown Ideal defend laissez-faire without exception; society: an atheist who backed legal abortion, but who called homosexuality immoral in a 1971 talk.'
	},
	{
		id: 'hayek', name: 'Friedrich Hayek', born: 1899, died: 1992, x: 88, y: -5, readings: { populism: -70 }, confidence: 'medium', wiki: 'Friedrich Hayek',
		basis: 'Economy: The Road to Serfdom, though it accepts a minimum safety net; society: Why I Am Not a Conservative, a liberal who distrusted both moral crusades and the left; populism: The Constitution of Liberty wants majorities bound by rules, and in 1981 he said he preferred a liberal dictator to an illiberal democracy.'
	},
	{
		id: 'friedman', name: 'Milton Friedman', born: 1912, died: 2006, x: 92, y: -35, confidence: 'high', wiki: 'Milton Friedman',
		basis: 'Economy: Capitalism and Freedom proposes school vouchers, a negative income tax and floating currencies; society: he argued to end the military draft and to legalise drugs.'
	},
	{
		id: 'buckley', name: 'William F. Buckley Jr.', born: 1925, died: 2008, x: 70, y: 55, confidence: 'medium', wiki: 'William F. Buckley Jr.',
		basis: 'Economy: National Review (1955) fused free-market and traditionalist conservatism; society: he defended segregation in the 1957 editorial \'Why the South Must Prevail\' and later said he had been wrong to think Jim Crow could fade without federal intervention, and he came to favour legalising drugs.'
	},
	{
		id: 'carter', name: 'Jimmy Carter', born: 1924, died: 2024, x: -10, y: -15, readings: { pacifism: 50, ecology: 55 }, confidence: 'medium', wiki: 'Jimmy Carter',
		basis: 'Economy: he deregulated airlines and trucking while creating Energy and Education departments; society: a devout Baptist who put human rights at the centre of his foreign policy; pacifism: the Camp David Accords; ecology: the 1980 Alaska lands act and solar panels on the White House.'
	},
	{
		id: 'martin-luther-king', name: 'Martin Luther King Jr.', born: 1929, died: 1968, x: -60, y: -40, readings: { pacifism: 90 }, confidence: 'high', wiki: 'Martin Luther King Jr.',
		basis: 'Economy: the Poor People\'s Campaign and a guaranteed income in Where Do We Go from Here; society: the civil rights movement; pacifism: nonviolent resistance and his 1967 speech against the Vietnam War.'
	},
	{
		id: 'milk', name: 'Harvey Milk', born: 1930, died: 1978, x: -30, y: -95, confidence: 'medium', wiki: 'Harvey Milk',
		basis: 'Society: the first openly gay elected official in California, behind the 1978 anti-discrimination ordinance and against the Briggs Initiative; economy is a reasoned reading of a small shopkeeper turned San Francisco supervisor.'
	},
	{
		id: 'pankhurst', name: 'Emmeline Pankhurst', born: 1858, died: 1928, x: 0, y: -65, confidence: 'low', wiki: 'Emmeline Pankhurst',
		basis: 'Society: she founded the Women\'s Social and Political Union for votes for women, by militant means; economy is a guess for someone who left the Independent Labour Party and stood as a Conservative candidate in 1926.'
	},
	{
		id: 'veil', name: 'Simone Veil', born: 1927, died: 2017, x: 15, y: -50, readings: { europe: 95 }, confidence: 'medium', wiki: 'Simone Veil',
		basis: 'Society: as health minister she carried the 1975 abortion law; economy is a reasoned reading of a centre-right minister in Giscard d\'Estaing\'s governments; Europe: she was the first president of the elected European Parliament in 1979.'
	},
	{
		id: 'maathai', name: 'Wangari Maathai', born: 1940, died: 2011, x: -40, y: -45, readings: { ecology: 100 }, confidence: 'medium', wiki: 'Wangari Maathai',
		basis: 'Society: she was jailed under Moi for her democratic campaigning and championed women\'s empowerment; economy is a reasoned reading of a community-based development movement; ecology: the Green Belt Movement planted millions of trees and earned the 2004 Nobel Peace Prize.'
	},
	{
		id: 'kelly', name: 'Petra Kelly', born: 1947, died: 1992, x: -55, y: -80, readings: { ecology: 100, pacifism: 95 }, confidence: 'high', wiki: 'Petra Kelly',
		basis: 'Economy: a co-founder of the German Greens on a programme of ecological social reform; society: a feminist and nonviolent activist; ecology: an anti-nuclear leader; pacifism: the peace movement against missile deployment in the 1980s.'
	},
	{
		id: 'dumont', name: 'René Dumont', born: 1904, died: 2001, x: -60, y: -30, readings: { ecology: 100 }, confidence: 'medium', wiki: 'René Dumont',
		basis: 'Economy: he stood as the first ecologist presidential candidate in 1974 against consumption and productivism, with a third-worldist redistribution; society: he pressed for rationing of consumption and for population control, which we read as a restrictive streak; ecology: the author of L\'utopie ou la mort (1973).'
	},
	{
		id: 'gandhi', name: 'Mahatma Gandhi', born: 1869, died: 1948, x: -55, y: 10, readings: { pacifism: 100, ecology: 50 }, confidence: 'medium', wiki: 'Mahatma Gandhi',
		basis: 'Economy: Hind Swaraj and the doctrine of trusteeship, village self-rule and spinning; society: religious, ascetic and ambivalent on caste, with early writings in South Africa on Black Africans that are now condemned; pacifism: satyagraha; ecology: the saying "enough for everyone\'s need, not for everyone\'s greed" is attributed to him.'
	},
	{
		id: 'nehru', name: 'Jawaharlal Nehru', born: 1889, died: 1964, x: -55, y: -30, readings: { pacifism: 55 }, confidence: 'medium', wiki: 'Jawaharlal Nehru',
		basis: 'Economy: the Five-Year Plans and a public sector on the "commanding heights"; society: a secular constitution and the Hindu Code Bills; pacifism: non-alignment, though he sent troops into Goa and lost a war with China.'
	},
	{
		id: 'ambedkar', name: 'B. R. Ambedkar', born: 1891, died: 1956, x: -50, y: -75, confidence: 'high', wiki: 'B. R. Ambedkar',
		basis: 'Economy: States and Minorities (1947) proposes public ownership of key industries and of agriculture; society: Annihilation of Caste, the drafting of the Constitution and the Hindu Code Bill for women\'s rights.'
	},
	{
		id: 'mandela', name: 'Nelson Mandela', born: 1918, died: 2013, x: -35, y: -55, confidence: 'medium', wiki: 'Nelson Mandela',
		basis: 'Economy: the 1955 Freedom Charter asked for nationalised banks and mines, but as president he kept a tight macroeconomic line; society: non-racialism, and the 1996 Constitution bars discrimination on sexual orientation.'
	},
	{
		id: 'tutu', name: 'Desmond Tutu', born: 1931, died: 2021, x: -25, y: -60, readings: { pacifism: 75 }, confidence: 'medium', wiki: 'Desmond Tutu',
		basis: 'Economy is a reasoned reading of his calls for economic sanctions and against inequality; society: he opposed apartheid, backed women priests and LGBT rights; pacifism: he preached nonviolent resistance and chaired the Truth and Reconciliation Commission.'
	},
	{
		id: 'sankara', name: 'Thomas Sankara', born: 1949, died: 1987, x: -85, y: -30, readings: { ecology: 75 }, confidence: 'medium', wiki: 'Thomas Sankara',
		basis: 'Economy: he nationalised land and mineral wealth and refused foreign debt; society: campaigns against female genital mutilation and polygamy, though he ruled through revolutionary committees; ecology: mass tree planting against the advance of the desert.'
	},
	{
		id: 'nyerere', name: 'Julius Nyerere', born: 1922, died: 1999, x: -85, y: 10, confidence: 'medium', wiki: 'Julius Nyerere',
		basis: 'Economy: the 1967 Arusha Declaration and the Ujamaa villages; society: a single-party state and a moral, egalitarian paternalism, which we read as slightly authoritarian.'
	},
	{
		id: 'sun-yat-sen', name: 'Sun Yat-sen', born: 1866, died: 1925, x: -35, y: 15, confidence: 'medium', wiki: 'Sun Yat-sen',
		basis: 'Economy: the Principle of the People\'s Livelihood, with equalised land ownership and state control of capital; society: nationalism and a period of party tutelage before democracy.'
	},
	{
		id: 'chavez', name: 'Hugo Chávez', born: 1954, died: 2013, x: -75, y: 20, readings: { populism: 95 }, confidence: 'medium', wiki: 'Hugo Chávez',
		basis: 'Economy: the social missions financed by oil and nationalisations; society: media restrictions and a personalised presidency; populism: his politics were framed as the people against the oligarchy.'
	},
	{
		id: 'peron', name: 'Juan Perón', born: 1895, died: 1974, x: -50, y: 55, readings: { populism: 90 }, confidence: 'medium', wiki: 'Juan Perón',
		basis: 'Economy: justicialism, powerful unions and nationalised utilities; society: women\'s suffrage in 1947 but press controls and the repression of the opposition; populism: a movement built on "the people" against the oligarchy.'
	},
	{
		id: 'allende', name: 'Salvador Allende', born: 1908, died: 1973, x: -75, y: -45, confidence: 'high', wiki: 'Salvador Allende',
		basis: 'Economy: the Unidad Popular programme nationalised copper, banks and large estates; society: the "Chilean road to socialism" respected press freedom and elections.'
	},
	{
		id: 'guevara', name: 'Che Guevara', born: 1928, died: 1967, x: -95, y: 15, readings: { pacifism: -95 }, confidence: 'medium', wiki: 'Che Guevara',
		basis: 'Economy: as minister of industry he pursued full state ownership and moral incentives; society: Socialism and Man in Cuba sets an austere ideal of the disciplined new man, which we read on the authoritarian side; pacifism: Guerrilla Warfare argues for armed struggle.'
	},
	{
		id: 'mujica', name: 'José Mujica', born: 1935, died: 2025, x: -45, y: -55, readings: { ecology: 60 }, confidence: 'medium', wiki: 'José Mujica',
		basis: 'Economy: a former Tupamaro who as president kept a mixed economy with social spending; society: under him Uruguay legalised cannabis, same-sex marriage and abortion; ecology: his Rio+20 speech criticised consumerism.'
	},
	{
		id: 'delors', name: 'Jacques Delors', born: 1925, died: 2023, x: -15, y: -20, readings: { europe: 100 }, confidence: 'medium', wiki: 'Jacques Delors',
		basis: 'Economy: finance minister at the 1983 turn to austerity, then president of the Commission behind the Social Charter; society is a reasoned reading of a social Catholic; Europe: the single market and the road to the euro.'
	},
	{
		id: 'giscard', name: 'Valéry Giscard d\'Estaing', born: 1926, died: 2020, x: 30, y: -10, readings: { europe: 95 }, confidence: 'medium', wiki: 'Valéry Giscard d\'Estaing',
		basis: 'Economy: a liberal-conservative who followed the Barre plan of budget restraint; society: the voting age at 18, divorce by mutual consent and the abortion law, but the 1974 halt to immigration; Europe: the European Council, the EMS and the European Constitution.'
	},
	{
		id: 'chirac', name: 'Jacques Chirac', born: 1932, died: 2019, x: 15, y: 20, readings: { europe: 55, pacifism: 30 }, confidence: 'low', wiki: 'Jacques Chirac',
		basis: 'Economy: the 1986 privatisations, then the 1995 campaign against the "social fracture"; society: he acknowledged French responsibility for the Vel d\'Hiv roundup and toughened security policy; Europe: the eurosceptic Cochin appeal of 1978, then support for the Maastricht Treaty and the euro; pacifism: he opposed the 2003 invasion of Iraq.'
	},
	{
		id: 'berlusconi', name: 'Silvio Berlusconi', born: 1936, died: 2023, x: 65, y: 30, readings: { populism: 60 }, confidence: 'low', wiki: 'Silvio Berlusconi',
		basis: 'Economy: Forza Italia promised tax cuts and deregulation, notably in the 2001 "contract with Italians"; society: an alliance with the Lega and the post-fascist Alleanza Nazionale, a reasoned guess on his own conservative tone; populism: the businessman who presented himself against the political class.'
	},
	{
		id: 'pompidou', name: 'Georges Pompidou', born: 1911, died: 1974, x: 20, y: 40, readings: { europe: 45 }, confidence: 'medium', wiki: 'Georges Pompidou',
		basis: 'Economy: industrial modernisation and state-backed champions in the 1960s and early 1970s, without nationalisations; society: a conservative president who signed the 1970 anti-rioters law and kept a traditional line on family questions; Europe: he lifted the veto on British entry after the 1969 Hague summit.'
	},
	{
		id: 'seguin', name: 'Philippe Séguin', born: 1943, died: 2010, x: -10, y: 40, readings: { europe: -65 }, confidence: 'medium', wiki: 'Philippe Séguin',
		basis: 'Economy: a social Gaullist who attacked the "single thought" and defended the state\'s role in the economy; society is a reasoned reading of a security-minded Republic-first Gaullist; Europe: his 1992 speech in the National Assembly against the Maastricht Treaty.'
	},
	{
		id: 'eisenhower', name: 'Dwight D. Eisenhower', born: 1890, died: 1969, x: 30, y: 30, confidence: 'medium', wiki: 'Dwight D. Eisenhower',
		basis: 'Economy: he kept the New Deal, built the Interstate highway system and kept the budget under tight control (three balanced budgets out of eight); society: he sent troops to Little Rock in 1957 but was slow to lead on civil rights, and his 1953 order barred gay people from federal jobs.'
	},
	{
		id: 'strauss', name: 'Franz Josef Strauss', born: 1915, died: 1988, x: 55, y: 80, confidence: 'medium', wiki: 'Franz Josef Strauss',
		basis: 'Economy: he industrialised Bavaria on free-market lines with state help for aerospace; society: a hard-line law-and-order conservative, at the centre of the 1962 Spiegel affair, who backed a nuclear role for West Germany.'
	},
	{
		id: 'de-gasperi', name: 'Alcide De Gasperi', born: 1881, died: 1954, x: 15, y: 35, readings: { europe: 95 }, confidence: 'medium', wiki: 'Alcide De Gasperi',
		basis: 'Economy: a Christian-democratic prime minister who stabilised the lira and carried out a land reform; society: a Catholic centrist who led his party against the communists in 1948; Europe: he backed the Coal and Steel Community and the European Defence Community.'
	},
	{
		id: 'long', name: 'Huey Long', born: 1893, died: 1935, x: -70, y: 30, readings: { populism: 95 }, confidence: 'medium', wiki: 'Huey Long',
		basis: 'Economy: the Share Our Wealth plan capped fortunes and promised every family a guaranteed income; society: he ran Louisiana as a machine boss, bullying opponents and the legislature; populism: "Every Man a King" against the big banks and oil companies.'
	},
	{
		id: 'nkrumah', name: 'Kwame Nkrumah', born: 1909, died: 1972, x: -60, y: 25, confidence: 'medium', wiki: 'Kwame Nkrumah',
		basis: 'Economy: Consciencism and a state-led industrialisation around the Volta dam; society: Pan-Africanism, but a one-party state and preventive detention from 1958.'
	},
	{
		id: 'leo-xiii', name: 'Leo XIII', born: 1810, died: 1903, x: -15, y: 80, confidence: 'medium', wiki: 'Pope Leo XIII',
		basis: 'Economy: the encyclical Rerum Novarum defends private property yet a living wage and workers\' associations, against both socialism and unrestrained markets; society: a traditional Catholic view of family, authority and the Church\'s place in the state.'
	},
	{
		id: 'day', name: 'Dorothy Day', born: 1897, died: 1980, x: -85, y: 5, readings: { pacifism: 95 }, confidence: 'medium', wiki: 'Dorothy Day',
		basis: 'Economy: the Catholic Worker movement lived by voluntary poverty and rejected both capitalism and the state; society: orthodox in Catholic morals after her conversion, though she was arrested at rallies; pacifism: she opposed the Second World War and Vietnam.'
	},
	{
		id: 'rothbard', name: 'Murray Rothbard', born: 1926, died: 1995, x: 100, y: -30, readings: { pacifism: 70 }, confidence: 'medium', wiki: 'Murray Rothbard',
		basis: 'Economy: For a New Liberty and The Ethics of Liberty argue for a stateless market order; society: he opposed drug laws and conscription, though from 1989 he turned to paleolibertarianism, backed Pat Buchanan in 1992, opposed the civil rights movement and held up David Duke as a model; pacifism: he opposed the military budget and American foreign wars.'
	}
];

export const FIGURES = FIGURES_DATA.map((f) => Object.freeze({ ...f, readings: Object.freeze({ ...(f.readings || {}) }) }));

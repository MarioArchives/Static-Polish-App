/* Numbers: how a number changes the noun (and verb) next to it. Same format as data-past.js.
   In table cells, [square brackets] mark the part to highlight.
   In sentences, word{gloss} gives the hover translation and ___ is the gap.
   Sentences have no p (person); the app finds the answer's cell by its form instead.
   Check with: node validate.js data-numbers.js NUMBERS */

const NUMBERS = {
  id: 'numbers', pl: 'Liczebniki', en: 'Numbers',
  intro: 'A number decides the case of the noun after it. One takes the singular, two to four take the nominative plural, and five and up take the genitive plural. Groups of men have their own forms, ordinals (first, second) behave like adjectives, and inside a sentence the number itself changes with the case.',
  groups: [
    {
      id: 'num-2-4', pl: 'Dwa–cztery', en: 'Two to four', q: 'dwa koty, dwie kobiety',
      summary: 'After 2, 3 and 4 the noun goes into the nominative plural and the verb is plural, just as with any plural subject. Two has a separate feminine form, dwie. Numbers ending in 2, 3 or 4 (22, 33, 104) follow the same rule, except 12, 13 and 14.',
      tables: [
        { title: 'Two, three and four with a noun',
          cols: [{ label: 'Masculine', tint: 'm' }, { label: 'Neuter', tint: 'n' }, { label: 'Feminine', tint: 'f' }],
          rows: [
            { who: '1', cells: ['jeden kot', 'jedno okno', 'jedna kobieta'] },
            { who: '2', cells: ['dwa kot[y]', 'dwa okn[a]', 'dw[ie] kobiet[y]'] },
            { who: '3', cells: ['trzy kot[y]', 'trzy okn[a]', 'trzy kobiet[y]'] },
            { who: '4', cells: ['cztery kot[y]', 'cztery okn[a]', 'cztery kobiet[y]'] },
            { who: '22, 23, 24', cells: ['dwadzieścia dwa kot[y]', 'dwadzieścia trzy okn[a]', 'dwadzieścia dw[ie] kobiet[y]'] },
          ] },
      ],
      rules: [
        { t: 'After 2, 3 and 4 the noun is in the nominative plural', ex: 'Mam dwa koty i trzy psy.', en: 'I have two cats and three dogs.' },
        { t: 'Dwie goes with feminine nouns, dwa with masculine and neuter ones', ex: 'Mam dwie siostry i dwa rowery.', en: 'I have two sisters and two bikes.' },
        { t: 'The verb is plural', ex: 'Na stole leżą cztery jabłka.', en: 'Four apples are lying on the table.' },
        { t: 'Bigger numbers that end in 2, 3 or 4 work the same way', ex: 'W klasie są dwadzieścia trzy krzesła.', en: 'There are twenty-three chairs in the classroom.' },
      ],
      watch: [
        'Jeden agrees like an adjective and the noun stays singular: jeden kot, jedna kobieta, jedno okno.',
        '12, 13 and 14 end in -naście, so they follow the five-and-up rule: dwanaście kotów, not dwanaście koty.',
        'Rok has an irregular plural: dwa lata, trzy lata, but pięć lat.',
        'Men are different: dwaj studenci or dwóch studentów, never dwa studenci. See the groups-with-men stripe.',
      ],
    },
    {
      id: 'num-5plus', pl: 'Pięć i więcej', en: 'Five and up', q: 'pięć kotów, dużo książek',
      summary: 'From 5 up the noun goes into the genitive plural and the verb is singular (neuter in the past tense). The same goes for 12 to 14, for bigger numbers ending in 5 to 9, 0 or 1, and for words of quantity: kilka, wiele, dużo, mało, ile.',
      tables: [
        { title: 'Five and up with a noun',
          cols: [{ label: 'Masculine', tint: 'm' }, { label: 'Neuter', tint: 'n' }, { label: 'Feminine', tint: 'f' }],
          rows: [
            { who: '5 to 21', cells: ['pięć kot[ów]', 'pięć okien', 'pięć kobiet'] },
            { who: '12, 13, 14', cells: ['dwanaście kot[ów]', 'trzynaście okien', 'czternaście kobiet'] },
            { who: '25, 31, 100', cells: ['dwadzieścia pięć kot[ów]', 'trzydzieści jeden okien', 'sto kobiet'] },
            { who: 'Quantity words', cells: ['kilka kot[ów]', 'dużo okien', 'mało kobiet'] },
          ] },
        { title: 'What the verb does',
          cols: [{ label: 'Present', tint: 'all' }, { label: 'Past', tint: 'all' }],
          rows: [
            { who: '2 to 4: plural', cells: ['Dwie kobiety czekaj[ą].', 'Dwie kobiety czekał[y].'] },
            { who: '5 and up: singular', cells: ['Pięć kobiet czek[a].', 'Pięć kobiet czekał[o].'] },
          ] },
      ],
      rules: [
        { t: 'From 5 up the noun is in the genitive plural', ex: 'Mam pięć książek.', en: 'I have five books.' },
        { t: 'The verb is singular, and in the past it takes the neuter -o', ex: 'Na przystanku czekało sześć osób.', en: 'Six people were waiting at the stop.' },
        { t: 'Kilka, wiele, dużo, mało and ile follow the same rule', ex: 'Ile masz lat?', en: 'How old are you? (literally: how many years do you have?)' },
        { t: 'Numbers ending in 1 (except 1 itself) also take the genitive plural', ex: 'Ona ma dwadzieścia jeden lat.', en: 'She is twenty-one.' },
      ],
      watch: [
        'Many genitive plurals have no ending: kobieta → kobiet, okno → okien (with an e slipping in), książka → książek.',
        'Dwadzieścia dwa, trzydzieści cztery go back to the two-to-four rule: dwadzieścia dwa koty.',
        'Pół (half), ćwierć (quarter) and tysiąc, milion also take the genitive: pół litra, tysiąc złotych.',
      ],
    },
    {
      id: 'num-men', pl: 'Mężczyźni', en: 'Groups with men', q: 'dwóch studentów, pięciu panów',
      summary: 'When the noun means men or a group with at least one man, numbers take their own forms: dwóch, trzech, czterech, pięciu, kilku, wielu, ilu. They go with the genitive plural and a singular verb. For 2 to 4 there is also an older form, dwaj, trzej, czterej, which takes the nominative plural and a plural verb.',
      tables: [
        { title: 'Numbers with men',
          cols: [{ label: 'Everyday form: genitive plural, verb singular', tint: 'm' }, { label: 'Also correct: nominative plural, verb plural', tint: 'all' }],
          rows: [
            { who: '2', cells: ['dw[óch] student[ów] przyszł[o]', 'dw[aj] studen[ci] przysz[li]'] },
            { who: '3', cells: ['trz[ech] student[ów] przyszł[o]', 'trz[ej] studen[ci] przysz[li]'] },
            { who: '4', cells: ['czter[ech] student[ów] przyszł[o]', 'czter[ej] studen[ci] przysz[li]'] },
            { who: '5 and up', cells: ['pię[ciu] student[ów] przyszł[o]', '—'] },
            { who: 'Some, many, how many', cells: ['kil[ku], wiel[u], il[u] student[ów]', '—'] },
          ] },
        { title: 'The same number with other nouns',
          cols: [{ label: 'Men', tint: 'm' }, { label: 'Women', tint: 'f' }, { label: 'Things and animals', tint: 'all' }],
          rows: [
            { who: '2', cells: ['dwóch braci', 'dwie siostry', 'dwa psy'] },
            { who: '5', cells: ['pięciu braci', 'pięć sióstr', 'pięć psów'] },
            { who: 'both', cells: ['obaj bracia, obu braci', 'obie siostry', 'oba psy'] },
          ] },
      ],
      rules: [
        { t: 'With men use dwóch, trzech, czterech, pięciu and so on, with the genitive plural', ex: 'W pokoju jest trzech studentów.', en: 'There are three students in the room.' },
        { t: 'The verb is singular, neuter in the past', ex: 'Na spotkanie przyszło pięciu panów.', en: 'Five gentlemen came to the meeting.' },
        { t: 'Dwaj, trzej and czterej take the nominative plural and a plural verb', ex: 'Dwaj bracia mieszkają w Krakowie.', en: 'Two brothers live in Kraków.' },
        { t: 'Kilku, wielu and ilu are the forms for men', ex: 'Ilu masz kolegów w pracy?', en: 'How many colleagues do you have at work?' },
      ],
      watch: [
        'This only applies to men and mixed groups. Dogs, women and children use the ordinary forms: dwa psy, dwie kobiety, pięć dzieci.',
        'Dzieci and osoby are not counted as men: pięć osób, dwoje dzieci.',
        'Dwaj, trzej, czterej exist only for 2, 3 and 4. From five on there is only pięciu, sześciu.',
      ],
    },
    {
      id: 'num-ordinal', pl: 'Porządkowe', en: 'First, second, third', q: 'pierwszy, drugi, trzeci',
      summary: 'Ordinal numbers are adjectives, so they take adjective endings and agree with their noun in gender, number and case. Drugi and trzeci end in -i and take the soft endings. They are used for floors, dates, clock times and anything in an order.',
      tables: [
        { title: 'Ordinals in the nominative',
          cols: [{ label: 'Masculine', tint: 'm' }, { label: 'Feminine', tint: 'f' }, { label: 'Neuter', tint: 'n' }],
          rows: [
            { who: '1st', cells: ['pierwsz[y]', 'pierwsz[a]', 'pierwsz[e]'] },
            { who: '2nd', cells: ['drug[i]', 'drug[a]', 'drug[ie]'] },
            { who: '3rd', cells: ['trzec[i]', 'trzeci[a]', 'trzeci[e]'] },
            { who: '4th, 5th, 6th', cells: ['czwart[y], piąt[y], szóst[y]', 'czwart[a], piąt[a], szóst[a]', 'czwart[e], piąt[e], szóst[e]'] },
            { who: '7th, 8th, 9th, 10th', cells: ['siódm[y], ósm[y], dziewiąt[y], dziesiąt[y]', 'siódm[a], ósm[a], dziewiąt[a], dziesiąt[a]', 'siódm[e], ósm[e], dziewiąt[e], dziesiąt[e]'] },
            { who: '20th, 100th', cells: ['dwudziest[y], set[ny]', 'dwudziest[a], setn[a]', 'dwudziest[e], setn[e]'] },
          ] },
        { title: 'Where you meet them',
          cols: [{ label: 'Pattern', tint: 'all' }, { label: 'Example', tint: 'all' }],
          rows: [
            { who: 'Today’s date', cells: ['day in the nominative, month in the genitive', 'Dziś jest piąt[y] maja.'] },
            { who: 'On a date', cells: ['day and month in the genitive', 'Przyjadę piąt[ego] maja.'] },
            { who: 'Clock time', cells: ['feminine, for godzina', 'Jest trzeci[a]. Spotkajmy się o trzeci[ej].'] },
            { who: 'Floor', cells: ['locative after na', 'Mieszkam na drugi[m] piętrze.'] },
          ] },
      ],
      rules: [
        { t: 'Ordinals agree with their noun like adjectives', ex: 'To jest moja pierwsza lekcja.', en: 'This is my first lesson.' },
        { t: 'On a date, the day and the month are both in the genitive', ex: 'Urodziłem się dziesiątego czerwca.', en: 'I was born on the tenth of June.' },
        { t: 'Clock times are feminine, because they agree with godzina', ex: 'Pociąg odjeżdża o szóstej.', en: 'The train leaves at six.' },
        { t: 'After a preposition the ordinal takes that case', ex: 'Mieszkam na trzecim piętrze.', en: 'I live on the third floor.' },
      ],
      watch: [
        'Drugi and trzeci take soft endings: drugiego, drugiej, trzecim, trzeciej.',
        'In compound ordinals every word changes: dwudziesty pierwszy, dwudziestego pierwszego.',
        'Years use the ordinal too: w dwa tysiące dwudziestym piątym roku (in 2025).',
      ],
    },
    {
      id: 'num-cases', pl: 'Odmiana', en: 'Numbers in other cases', q: 'z dwoma, o pięciu',
      summary: 'Numbers change with the case too. In the genitive, dative, instrumental and locative the five-and-up rule no longer applies: the number and the noun both take the case the sentence needs. The accusative looks like the nominative, except with men.',
      tables: [
        { title: 'Two, three, five through the cases',
          cols: [{ label: '2, masc. and neuter', tint: 'm' }, { label: '2, feminine', tint: 'f' }, { label: '3 (4 the same way)', tint: 'all' }, { label: '5 (6 and up the same way)', tint: 'all' }],
          rows: [
            { who: 'Nominative', cells: ['dwa', 'dwie', 'trzy', 'pięć'] },
            { who: 'Genitive', cells: ['dw[óch]', 'dw[óch]', 'trz[ech]', 'pię[ciu]'] },
            { who: 'Dative', cells: ['dw[óm]', 'dw[óm]', 'trz[em]', 'pię[ciu]'] },
            { who: 'Accusative', cells: ['dwa (men: dwóch)', 'dwie', 'trzy (men: trzech)', 'pięć (men: pięciu)'] },
            { who: 'Instrumental', cells: ['dw[oma]', 'dw[iema]', 'trz[ema]', 'pię[cioma]'] },
            { who: 'Locative', cells: ['dw[óch]', 'dw[óch]', 'trz[ech]', 'pię[ciu]'] },
          ] },
      ],
      rules: [
        { t: 'In the instrumental the number and the noun are both instrumental', ex: 'Mieszkam z dwoma kolegami.', en: 'I live with two friends.' },
        { t: 'In the genitive the noun is genitive plural after every number', ex: 'Czekam od trzech godzin.', en: 'I have been waiting for three hours.' },
        { t: 'The same goes for the locative and the dative', ex: 'Opowiadam o pięciu miastach.', en: 'I am talking about five cities.' },
        { t: 'The accusative looks like the nominative, except with men', ex: 'Widzę dwa koty, ale znam dwóch lekarzy.', en: 'I see two cats, but I know two doctors.' },
      ],
      watch: [
        'Dwie has its own instrumental: z dwiema siostrami. Z dwoma siostrami is heard too, but dwiema is the standard.',
        'Genitive and locative of 2, 3 and 4 look the same: od dwóch, o dwóch.',
        'Pięć and higher use -ciu for almost every case, and -cioma for the instrumental: z pięcioma, z sześcioma.',
      ],
    },
  ],
  sentences: [
    // Dwa–cztery
    { c: 'num-2-4', at: ['2','Feminine'], s: 'Mam{I have} dwie{two} ___.', base: 'siostra', gloss: 'sister', a: ['siostry'], en: 'I have two sisters.', why: 'After two the noun goes into the nominative plural: siostry. Dwie is the feminine form of two.' },
    { c: 'num-2-4', at: ['3','Neuter'], s: 'Na{on} stole{table|m2} leżą{are lying} trzy{three} ___.', base: 'jabłko', gloss: 'apple', a: ['jabłka'], en: 'Three apples are lying on the table.', why: 'After three the noun is in the nominative plural. Neuter nouns in -o take -a: jabłka.' },
    { c: 'num-2-4', at: ['2','Feminine'], s: 'Mam{I have} ___ córki{daughters|f.pl}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwie'], en: 'I have two daughters.', why: 'Córka is feminine, so two is dwie, not dwa.' },
    { c: 'num-2-4', at: ['3','Feminine'], s: 'Czekam{I have been waiting} już{already} trzy{three} ___.', base: 'minuta', gloss: 'minute', a: ['minuty'], en: 'I have been waiting for three minutes already.', why: 'After three the noun takes the plural form minuty, the same as the nominative plural.' },
    { c: 'num-2-4', at: ['2','Masculine'], s: 'Mój{my|m1} syn{son|m1} ma{has} dwa{two} ___.', base: 'rok', gloss: 'year', a: ['lata'], en: 'My son is two years old.', why: 'Rok has an irregular plural: dwa lata, trzy lata, cztery lata.' },
    { c: 'num-2-4', at: ['22, 23, 24','Feminine'], s: 'W{in} klasie{classroom|f} są{there are} dwadzieścia{twenty} dwie{two} ___.', base: 'ławka', gloss: 'desk', a: ['ławki'], en: 'There are twenty-two desks in the classroom.', why: 'Twenty-two ends in two, so the noun is in the nominative plural: ławki.' },
    { c: 'num-2-4', at: ['2','Masculine'], s: 'Dwa{two} ___ szczekają{are barking} pod{under} oknem{window|n}.', base: 'pies', gloss: 'dog', a: ['psy'], en: 'Two dogs are barking under the window.', why: 'After two the noun is in the nominative plural. Pies loses its e: psy.' },
    { c: 'num-2-4', at: ['2','Feminine'], s: 'Na{at} przystanku{stop|m2} ___ dwie{two} kobiety{women|f.pl}.', base: 'czekać', gloss: 'to wait', a: ['czekają'], en: 'Two women are waiting at the stop.', why: 'With two, three and four the verb is plural, just as with any plural subject: czekają.' },
    { c: 'num-2-4', at: ['2','Masculine'], s: 'Kupiłem{I bought} dwa{two} ___ do{to} Gdańska{Gdańsk|m2}.', base: 'bilet', gloss: 'ticket', a: ['bilety'], en: 'I bought two tickets to Gdańsk.', why: 'After two the noun is in the nominative plural. Bilet is a masculine thing, so it takes -y: bilety.' },
    { c: 'num-2-4', at: ['4','Feminine'], s: 'W{in} tym{this|m2} budynku{building|m2} są{there are} cztery{four} ___.', base: 'winda', gloss: 'lift', a: ['windy'], en: 'There are four lifts in this building.', why: 'After four the noun is in the nominative plural. Feminine nouns in -a take -y: windy.' },
    { c: 'num-2-4', at: ['3','Masculine'], s: 'Na{in} parkingu{car park|m2} stały{were standing} trzy{three} ___.', base: 'samochód', gloss: 'car', a: ['samochody'], en: 'Three cars were parked in the car park.', why: 'After three the noun is in the nominative plural: samochody. The verb is plural too.' },
    { c: 'num-2-4', at: ['2','Neuter'], s: 'Mamy{we have} ___ nowe{new|n.pl} okna{windows|n.pl} w{in} kuchni{kitchen|f}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwa'], en: 'We have two new windows in the kitchen.', why: 'Okno is neuter, and neuter nouns take dwa, not dwie.' },

    // Pięć i więcej
    { c: 'num-5plus', at: ['5 to 21','Feminine'], s: 'Mam{I have} pięć{five} ___.', base: 'książka', gloss: 'book', a: ['książek'], en: 'I have five books.', why: 'From five up the noun takes the genitive plural. Książka drops its ending and an e slips in: książek.' },
    { c: 'num-5plus', at: ['5 to 21','Masculine'], s: 'W{in} tym{this|n} mieście{town|n} jest{there are} sześć{six} ___.', base: 'kościół', gloss: 'church', a: ['kościołów'], en: 'There are six churches in this town.', why: 'After six the noun is in the genitive plural. Masculine nouns usually take -ów: kościołów.' },
    { c: 'num-5plus', at: ['5 to 21','Neuter'], s: 'Kupiłam{I bought} dziesięć{ten} ___.', base: 'jajko', gloss: 'egg', a: ['jajek'], en: 'I bought ten eggs.', why: 'After ten the noun takes the genitive plural. Jajko has no ending there and an e slips in: jajek.' },
    { c: 'num-5plus', at: ['Quantity words','Feminine'], s: 'Na{at} imprezie{party|f} było{there were} dużo{a lot of} ___.', base: 'osoba', gloss: 'person', a: ['osób'], en: 'There were a lot of people at the party.', why: 'Dużo works like five and up, so the noun is genitive plural: osób.' },
    { c: 'num-5plus', at: ['Quantity words','Neuter'], s: 'Ile{how many} ___ jest{are there} w{in} tym{this|m2} pokoju{room|m2}?', base: 'krzesło', gloss: 'chair', a: ['krzeseł'], en: 'How many chairs are there in this room?', why: 'Ile takes the genitive plural. Krzesło loses its ending and an e slips in: krzeseł.' },
    { c: 'num-5plus', at: ['25, 31, 100','Masculine'], s: 'Moja{my|f} babcia{grandma|f} ma{has} osiemdziesiąt{eighty} ___.', base: 'rok', gloss: 'year', a: ['lat'], en: 'My grandma is eighty years old.', why: 'From five up rok uses the genitive plural lat: osiemdziesiąt lat.' },
    { c: 'num-5plus', at: ['5 and up: singular','Past'], s: 'W{in} autobusie{bus|m2} ___ siedem{seven} kobiet{women|f.pl}.', base: 'jechać', gloss: 'to ride', a: ['jechało'], en: 'Seven women were riding on the bus.', why: 'With five and up the verb is singular, and in the past tense it takes the neuter -o: jechało.' },
    { c: 'num-5plus', at: ['5 and up: singular','Past'], s: 'Wczoraj{yesterday} ___ pięć{five} listów{letters|m2.pl}.', base: 'przyjść', gloss: 'to come', a: ['przyszło'], en: 'Five letters came yesterday.', why: 'After five the past-tense verb is neuter singular: przyszło.' },
    { c: 'num-5plus', at: ['5 to 21','Masculine'], s: 'Ten{this|m2} pociąg{train|m2} ma{has} osiem{eight} ___.', base: 'wagon', gloss: 'carriage', a: ['wagonów'], en: 'This train has eight carriages.', why: 'From five up the noun takes the genitive plural. Masculine nouns usually take -ów: wagonów.' },
    { c: 'num-5plus', at: ['Quantity words','Feminine'], s: 'Zostało{remained} mi{to me} tylko{only} kilka{a few} ___.', base: 'minuta', gloss: 'minute', a: ['minut'], en: 'I only have a few minutes left.', why: 'Kilka follows the five-and-up rule, so the noun is genitive plural: minut. The verb is neuter singular, zostało.' },
    { c: 'num-5plus', at: ['12, 13, 14','Masculine'], s: 'Na{in} drzewie{tree|n} siedzi{is sitting} dwanaście{twelve} ___.', base: 'ptak', gloss: 'bird', a: ['ptaków'], en: 'Twelve birds are sitting in the tree.', why: 'Twelve ends in -naście, so it follows the five-and-up rule: genitive plural ptaków and a singular verb.' },
    { c: 'num-5plus', at: ['25, 31, 100','Feminine'], s: 'W{in} tej{this|f} klasie{class|f} jest{there are} dwadzieścia{twenty} jeden{one} ___.', base: 'uczennica', gloss: 'schoolgirl', a: ['uczennic'], en: 'There are twenty-one girls in this class.', why: 'Numbers ending in 1, except 1 itself, take the genitive plural: uczennic.' },

    // Mężczyźni
    { c: 'num-men', at: ['2','Everyday form: genitive plural, verb singular'], s: 'W{in} poczekalni{waiting room|f} czeka{is waiting} dwóch{two} ___.', base: 'lekarz', gloss: 'doctor', a: ['lekarzy'], en: 'Two doctors are waiting in the waiting room.', why: 'Dwóch is the form for men, and it takes the genitive plural: lekarzy.' },
    { c: 'num-men', at: ['5 and up','Everyday form: genitive plural, verb singular'], s: 'Na{to} imprezę{party|f} przyszło{came} pięciu{five} ___.', base: 'kolega', gloss: 'friend', a: ['kolegów'], en: 'Five friends came to the party.', why: 'Pięciu is used for men and takes the genitive plural: kolegów.' },
    { c: 'num-men', at: ['3','Everyday form: genitive plural, verb singular'], s: 'Mam{I have} ___ braci{brothers|m1.pl}.', base: 'trzy', hint: '3', gloss: 'three', a: ['trzech'], en: 'I have three brothers.', why: 'Brothers are men, so three is trzech, with the genitive plural braci.' },
    { c: 'num-men', at: ['2','Also correct: nominative plural, verb plural'], s: '___ policjanci{policemen|m1.pl} stali{were standing} przed{in front of} bankiem{bank|m2}.', base: 'dwa', hint: '2', gloss: 'two', a: ['Dwaj'], en: 'Two policemen were standing in front of the bank.', why: 'Policjanci is nominative plural and the verb is plural, so the number must be dwaj.' },
    { c: 'num-men', at: ['5 and up','Everyday form: genitive plural, verb singular'], s: 'Na{to} mecz{match|m2} ___ sześciu{six} chłopców{boys|m1.pl}.', base: 'przyjść', gloss: 'to come', a: ['przyszło'], en: 'Six boys came to the match.', why: 'With sześciu and the genitive plural the verb is singular, neuter in the past: przyszło.' },
    { c: 'num-men', at: ['4','Also correct: nominative plural, verb plural'], s: 'Czterej{four} kelnerzy{waiters|m1.pl} ___ bardzo{very} szybko{quickly}.', base: 'pracować', gloss: 'to work', a: ['pracowali'], en: 'Four waiters were working very fast.', why: 'Czterej takes the nominative plural and a plural verb. For men the past plural ends in -li: pracowali.' },
    { c: 'num-men', at: ['Some, many, how many','Everyday form: genitive plural, verb singular'], s: 'Ilu{how many} ___ pracuje{works} w{in} twoim{your|n} biurze{office|n}?', base: 'mężczyzna', gloss: 'man', a: ['mężczyzn'], en: 'How many men work in your office?', why: 'Ilu is the form for men and takes the genitive plural: mężczyzn.' },
    { c: 'num-men', at: ['Some, many, how many','Everyday form: genitive plural, verb singular'], s: 'Znam{I know} kilku{a few} ___ z{from} pracy{work|f}.', base: 'Anglik', gloss: 'Englishman', a: ['Anglików'], en: 'I know a few Englishmen from work.', why: 'Kilku is used for men and takes the genitive plural: Anglików.' },
    { c: 'num-men', at: ['5 and up','Everyday form: genitive plural, verb singular'], s: 'W{in} autobusie{bus|m2} siedziało{were sitting} ___ żołnierzy{soldiers|m1.pl}.', base: 'siedem', hint: '7', gloss: 'seven', a: ['siedmiu'], en: 'Seven soldiers were sitting on the bus.', why: 'Soldiers are men, so seven takes its men form, siedmiu.' },
    { c: 'num-men', at: ['Some, many, how many','Everyday form: genitive plural, verb singular'], s: 'Na{at} spotkaniu{meeting|n} było{there were} ___ nauczycieli{teachers|m1.pl}.', base: 'wiele', hint: 'many', gloss: 'many', a: ['wielu'], en: 'There were many teachers at the meeting.', why: 'With men (or a mixed group) wiele becomes wielu.' },
    { c: 'num-men', at: ['3','Also correct: nominative plural, verb plural'], s: 'Trzej{three} ___ grali{were playing} w{at} piłkę{ball|f} na{in} podwórku{yard|n}.', base: 'chłopiec', gloss: 'boy', a: ['chłopcy'], en: 'Three boys were playing football in the yard.', why: 'Trzej takes the nominative plural: chłopcy. The verb is plural too.' },
    { c: 'num-men', at: ['4','Everyday form: genitive plural, verb singular'], s: 'Do{to} kina{cinema|n} poszło{went} ___ przyjaciół{friends|m1.pl}.', base: 'cztery', hint: '4', gloss: 'four', a: ['czterech'], en: 'Four friends went to the cinema.', why: 'Przyjaciół is genitive plural and the verb is neuter singular, so the number is the men form czterech.' },

    // Porządkowe
    { c: 'num-ordinal', at: ['Floor','Example'], s: 'Mieszkam{I live} na{on} ___ piętrze{floor|n}.', base: 'piąty', hint: '5th', gloss: 'fifth', a: ['piątym'], en: 'I live on the fifth floor.', why: 'Na with a place takes the locative. Piętro is neuter, so the ordinal ends in -ym: piątym.' },
    { c: 'num-ordinal', at: ['On a date','Example'], s: 'Egzamin{the exam|m2} mam{I have} ___ czerwca{of June|m2}.', base: 'trzeci', hint: '3rd', gloss: 'third', a: ['trzeciego'], en: 'I have the exam on the third of June.', why: 'On a date the day is in the genitive. Trzeci takes the soft ending: trzeciego.' },
    { c: 'num-ordinal', at: ['On a date','Example'], s: 'Urodziłam{I was born} się{(reflexive)} ___ marca{of March|m2}.', base: 'drugi', hint: '2nd', gloss: 'second', a: ['drugiego'], en: 'I was born on the second of March.', why: 'On a date the day is in the genitive. Drugi takes the soft ending: drugiego.' },
    { c: 'num-ordinal', at: ['Clock time','Example'], s: 'Spotkajmy{let\'s meet} się{(reflexive)} o{at} ___.', base: 'ósmy', hint: '8:00', gloss: 'eighth', a: ['ósmej'], en: 'Let\'s meet at eight.', why: 'Clock times are feminine because of godzina. O takes the locative: o ósmej.' },
    { c: 'num-ordinal', at: ['Clock time','Example'], s: 'Jest{it is} już{already} ___.', base: 'siódmy', hint: '7:00', gloss: 'seventh', a: ['siódma'], en: 'It\'s already seven o\'clock.', why: 'Telling the time uses the feminine nominative, agreeing with godzina: siódma.' },
    { c: 'num-ordinal', at: ['1st','Feminine'], s: 'To{this} jest{is} moja{my|f} ___ podróż{trip|f} do{to} Polski{Poland|f}.', base: 'pierwszy', hint: '1st', gloss: 'first', a: ['pierwsza'], en: 'This is my first trip to Poland.', why: 'Podróż is feminine, so the ordinal takes the feminine ending: pierwsza.' },
    { c: 'num-ordinal', at: ['3rd','Masculine'], s: 'Siedzieliśmy{we sat} w{in} ___ rzędzie{row|m2}.', base: 'trzeci', hint: '3rd', gloss: 'third', a: ['trzecim'], en: 'We sat in the third row.', why: 'W with a place takes the locative. Trzeci is soft, so it becomes trzecim.' },
    { c: 'num-ordinal', at: ['4th, 5th, 6th','Feminine'], s: 'Mój{my|m1} syn{son|m1} chodzi{goes} do{to} ___ klasy{class|f}.', base: 'czwarty', hint: '4th', gloss: 'fourth', a: ['czwartej'], en: 'My son is in fourth grade.', why: 'Do takes the genitive and klasa is feminine, so the ordinal is czwartej.' },
    { c: 'num-ordinal', at: ['7th, 8th, 9th, 10th','Masculine'], s: 'Nie{not} widziałem{I have seen} ___ odcinka{episode|m2}.', base: 'dziewiąty', hint: '9th', gloss: 'ninth', a: ['dziewiątego'], en: 'I haven\'t seen the ninth episode.', why: 'After a negated verb the object is in the genitive, so the ordinal takes -ego: dziewiątego.' },
    { c: 'num-ordinal', at: ['3rd','Neuter'], s: 'To{this} jest{is} nasze{our|n} ___ dziecko{child|n}.', base: 'trzeci', hint: '3rd', gloss: 'third', a: ['trzecie'], en: 'This is our third child.', why: 'Dziecko is neuter, and trzeci takes the soft neuter ending: trzecie.' },
    { c: 'num-ordinal', at: ['Clock time','Example'], s: 'Wróciłem{I came back} do{to} domu{home|m2} po{after} ___.', base: 'dziesiąty', hint: '10:00', gloss: 'tenth', a: ['dziesiątej'], en: 'I came home after ten.', why: 'Clock times are feminine. Po takes the locative: po dziesiątej.' },
    { c: 'num-ordinal', at: ['20th, 100th','Masculine'], s: 'Mój{my|m1} dziadek{grandfather|m1} urodził{was born} się{(reflexive)} w{in} tysiąc{one thousand} dziewięćset{nine hundred} ___ roku{year|m2}.', base: 'pięćdziesiąty', hint: '1950', gloss: 'fiftieth', a: ['pięćdziesiątym'], en: 'My grandfather was born in 1950.', why: 'Years use the ordinal. W with roku takes the locative, so the last word is pięćdziesiątym.' },

    // Odmiana
    { c: 'num-cases', at: ['Instrumental','2, feminine'], s: 'Mieszkam{I live} z{with} ___ siostrami{sisters|f.pl}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwiema', 'dwoma'], en: 'I live with my two sisters.', why: 'Z takes the instrumental. For feminine nouns the standard form of two is dwiema.' },
    { c: 'num-cases', at: ['Instrumental','3 (4 the same way)'], s: 'Rozmawiałem{I talked} z{with} trzema{three} ___.', base: 'sąsiad', gloss: 'neighbour', a: ['sąsiadami'], en: 'I talked to three neighbours.', why: 'After z both the number and the noun are instrumental: trzema sąsiadami.' },
    { c: 'num-cases', at: ['Genitive','5 (6 and up the same way)'], s: 'Zadzwoniłem{I called} do{to} ___ firm{companies|f.pl}.', base: 'pięć', hint: '5', gloss: 'five', a: ['pięciu'], en: 'I called five companies.', why: 'Do takes the genitive, and the genitive of pięć is pięciu.' },
    { c: 'num-cases', at: ['Locative','2, feminine'], s: 'Opowiadała{she was talking} o{about} ___ podróżach{trips|f.pl}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwóch'], en: 'She was talking about two trips.', why: 'O takes the locative. The locative of two is dwóch for every gender.' },
    { c: 'num-cases', at: ['Dative','3 (4 the same way)'], s: 'Pomagam{I help} trzem{three} ___.', base: 'sąsiadka', gloss: 'neighbour', a: ['sąsiadkom'], en: 'I help three neighbours.', why: 'Pomagać takes the dative, so both words are dative: trzem sąsiadkom.' },
    { c: 'num-cases', at: ['Dative','2, masc. and neuter'], s: 'Wysłałem{I sent} zdjęcia{photos|n.pl} ___ kolegom{friends|m1.pl}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwóm'], en: 'I sent the photos to two friends.', why: 'Kolegom is dative, so the number is dative too: dwóm.' },
    { c: 'num-cases', at: ['Instrumental','5 (6 and up the same way)'], s: 'Jadę{I am travelling} z{with} pięcioma{five} ___.', base: 'walizka', gloss: 'suitcase', a: ['walizkami'], en: 'I am travelling with five suitcases.', why: 'In the instrumental the five-and-up rule no longer applies: pięcioma walizkami, both instrumental.' },
    { c: 'num-cases', at: ['Instrumental','3 (4 the same way)'], s: 'Szukam{I am looking for} mieszkania{flat|n} z{with} ___ pokojami{rooms|m2.pl}.', base: 'trzy', hint: '3', gloss: 'three', a: ['trzema'], en: 'I am looking for a flat with three rooms.', why: 'Z takes the instrumental, and the instrumental of trzy is trzema.' },
    { c: 'num-cases', at: ['Genitive','3 (4 the same way)'], s: 'Brakuje{are missing} nam{to us} czterech{four} ___.', base: 'krzesło', gloss: 'chair', a: ['krzeseł'], en: 'We are four chairs short.', why: 'Brakować takes the genitive, so the noun is genitive plural after czterech: krzeseł.' },
    { c: 'num-cases', at: ['Accusative','2, masc. and neuter'], s: 'Widzę{I see} ___ policjantów{policemen|m1.pl} przed{in front of} sklepem{shop|m2}.', base: 'dwa', hint: '2', gloss: 'two', a: ['dwóch'], en: 'I see two policemen in front of the shop.', why: 'In the accusative men take the genitive-looking form: dwóch policjantów.' },
    { c: 'num-cases', at: ['Accusative','2, feminine'], s: 'Zaprosiłam{I invited} dwie{two} ___ na{for} kawę{coffee|f}.', base: 'koleżanka', gloss: 'friend', a: ['koleżanki'], en: 'I invited two friends for coffee.', why: 'The accusative looks like the nominative when the noun is not a man: dwie koleżanki.' },
    { c: 'num-cases', at: ['Locative','5 (6 and up the same way)'], s: 'Byłem{I have been} w{in} sześciu{six} ___ Europy{of Europe|f}.', base: 'kraj', gloss: 'country', a: ['krajach'], en: 'I have been to six European countries.', why: 'W with a place takes the locative, so the noun is locative plural after sześciu: krajach.' },
  ],
};

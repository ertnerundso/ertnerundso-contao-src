<?php

return [
    'label' => [
        'de' => ['Konfigurator-Szene', 'Scroll-Szene mit Laptop und drei Nutzenkarten.'],
        'en' => ['Configurator scene', 'Scroll scene with laptop and three benefit cards.'],
    ],
    'types' => ['content'],
    'contentCategory' => 'media',
    'beTemplate' => 'be_wildcard',
    'wrapper' => ['type' => 'none'],
    'fields' => [
        'eyebrow' => ['label' => ['de' => ['Kennzeichnung', ''], 'en' => ['Eyebrow', '']], 'inputType' => 'text', 'eval' => ['mandatory' => true]],
        'sceneTitle' => ['label' => ['de' => ['Überschrift', ''], 'en' => ['Heading', '']], 'inputType' => 'text', 'eval' => ['mandatory' => true]],
        'imageAlt' => ['label' => ['de' => ['Bildbeschreibung', 'Kurzer Alternativtext für den Konfigurator auf dem Laptop. Leer verwendet die Standardbeschreibung.'], 'en' => ['Image description', 'Short alternative text for the configurator on the laptop. Leave blank to use the default description.']], 'inputType' => 'text'],
        'introLead' => ['label' => ['de' => ['Einleitung, hervorgehoben', ''], 'en' => ['Intro lead', '']], 'inputType' => 'text'],
        'introText' => ['label' => ['de' => ['Einleitung', ''], 'en' => ['Intro text', '']], 'inputType' => 'textarea', 'eval' => ['rows' => 2]],
        'detailText' => ['label' => ['de' => ['Zweiter Absatz', ''], 'en' => ['Second paragraph', '']], 'inputType' => 'textarea', 'eval' => ['rows' => 2]],
        'cardOneTitle' => ['label' => ['de' => ['Karte 1: Titel', ''], 'en' => ['Card 1: title', '']], 'inputType' => 'text'],
        'cardOneText' => ['label' => ['de' => ['Karte 1: Text', ''], 'en' => ['Card 1: text', '']], 'inputType' => 'text'],
        'cardOneDetail' => ['label' => ['de' => ['Karte 1: Detail', ''], 'en' => ['Card 1: detail', '']], 'inputType' => 'text'],
        'cardTwoTitle' => ['label' => ['de' => ['Karte 2: Titel', ''], 'en' => ['Card 2: title', '']], 'inputType' => 'text'],
        'cardTwoText' => ['label' => ['de' => ['Karte 2: Text', ''], 'en' => ['Card 2: text', '']], 'inputType' => 'text'],
        'cardTwoDetail' => ['label' => ['de' => ['Karte 2: Detail', ''], 'en' => ['Card 2: detail', '']], 'inputType' => 'text'],
        'cardThreeTitle' => ['label' => ['de' => ['Karte 3: Titel', ''], 'en' => ['Card 3: title', '']], 'inputType' => 'text'],
        'cardThreeText' => ['label' => ['de' => ['Karte 3: Text', ''], 'en' => ['Card 3: text', '']], 'inputType' => 'text'],
        'cardThreeDetail' => ['label' => ['de' => ['Karte 3: Detail', ''], 'en' => ['Card 3: detail', '']], 'inputType' => 'text'],
    ],
];

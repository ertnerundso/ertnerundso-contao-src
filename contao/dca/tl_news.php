<?php

// Redaktionelles Journal-Thema: unabhängig vom Titel und ohne weiteres Plugin.
use Contao\CoreBundle\DataContainer\PaletteManipulator;

$GLOBALS['TL_DCA']['tl_news']['fields']['eoTopic'] = [
    'label' => &$GLOBALS['TL_LANG']['tl_news']['eoTopic'],
    'exclude' => true,
    'filter' => true,
    'inputType' => 'select',
    'options' => ['visuals', 'motion', 'assembly'],
    'reference' => &$GLOBALS['TL_LANG']['tl_news']['eoTopicOptions'],
    'default' => 'visuals',
    'eval' => ['mandatory' => true, 'tl_class' => 'w50'],
    'sql' => ['type' => 'string', 'length' => 16, 'default' => 'visuals'],
];

foreach (['default', 'internal', 'article', 'external'] as $palette) {
    PaletteManipulator::create()
        ->addField('eoTopic', 'teaser_legend', PaletteManipulator::POSITION_APPEND)
        ->applyToPalette($palette, 'tl_news');
}

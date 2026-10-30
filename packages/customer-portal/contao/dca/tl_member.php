<?php
declare(strict_types=1);

use Ertnerundso\CustomerPortal\Backend\BackendGuard;
use Ertnerundso\CustomerPortal\Backend\PortalSchema;

$GLOBALS['TL_DCA']['tl_member']['fields']['firma_id'] = PortalSchema::relation('Portal-Firma', 'tl_portal_firma', 'name');
$GLOBALS['TL_DCA']['tl_member']['fields']['firma_id']['eval']['mandatory'] = false;
$GLOBALS['TL_DCA']['tl_member']['fields']['firma_id']['save_callback'] = [static function ($value, $dc) {
    BackendGuard::adminOnly();
    return (int) $value === 0 ? 0 : BackendGuard::validateRelation($value, $dc);
}];
$GLOBALS['TL_DCA']['tl_member']['fields']['rolle'] = [
    'label' => ['Portal-Rolle', 'Eine Rolle gewährt nur zusammen mit Firma und Mitgliedergruppe Zugriff.'],
    'inputType' => 'select', 'options' => ['entscheider' => 'Entscheider', 'mitleser' => 'Mitleser'],
    'eval' => ['includeBlankOption' => true, 'tl_class' => 'w50'],
    'save_callback' => [static function ($value) { BackendGuard::adminOnly(); return $value; }],
    'sql' => "varchar(32) NOT NULL default ''",
];
$GLOBALS['TL_DCA']['tl_member']['fields']['es_id'] = [
    'label' => ['ES-ID', ''], 'inputType' => 'text', 'eval' => ['maxlength' => 255, 'tl_class' => 'w50'],
    'sql' => "varchar(255) NOT NULL default ''",
];
$GLOBALS['TL_DCA']['tl_member']['palettes']['default'] .= ';{portal_legend},firma_id,rolle,es_id';
$GLOBALS['TL_DCA']['tl_member']['config']['sql']['keys']['firma_id'] = 'index';

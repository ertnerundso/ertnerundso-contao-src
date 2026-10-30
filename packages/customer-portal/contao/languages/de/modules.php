<?php
declare(strict_types=1);
$GLOBALS['TL_LANG']['MOD']['customer_portal'] = ['Kundenportal', 'Geschützte Kundenprojekte'];
foreach (['firma' => 'Firmen', 'projekt' => 'Projekte', 'phase' => 'Projektphasen', 'version' => 'Versionen', 'kommentar' => 'Kommentare', 'zeichnung' => 'Zeichnungen', 'freigabe' => 'Freigaben', 'abgabe' => 'Abgaben', 'ereignis' => 'Ereignisse'] as $key => $label) {
    $GLOBALS['TL_LANG']['MOD']['portal_'.$key] = [$label, $label.' im Kundenportal'];
}
$GLOBALS['TL_LANG']['tl_member']['portal_legend'] = 'Kundenportal';

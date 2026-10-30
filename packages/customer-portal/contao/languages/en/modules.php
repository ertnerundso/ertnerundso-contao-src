<?php
declare(strict_types=1);
$GLOBALS['TL_LANG']['MOD']['customer_portal'] = ['Customer portal', 'Protected customer projects'];
foreach (['firma' => 'Companies', 'projekt' => 'Projects', 'phase' => 'Project phases', 'version' => 'Versions', 'kommentar' => 'Comments', 'zeichnung' => 'Annotations', 'freigabe' => 'Approvals', 'abgabe' => 'Deliveries', 'ereignis' => 'Events'] as $key => $label) {
    $GLOBALS['TL_LANG']['MOD']['portal_'.$key] = [$label, $label.' in the customer portal'];
}
$GLOBALS['TL_LANG']['tl_member']['portal_legend'] = 'Customer portal';

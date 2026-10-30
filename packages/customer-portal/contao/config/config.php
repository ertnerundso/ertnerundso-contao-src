<?php
declare(strict_types=1);

// Eigene native Backend-Module; Kundendateien werden niemals als öffentliche Assets registriert.
foreach (\Ertnerundso\CustomerPortal\Backend\PortalSchema::TABLES as $entity) {
    $GLOBALS['BE_MOD']['customer_portal']['portal_'.$entity] = ['tables' => ['tl_portal_'.$entity]];
}
$GLOBALS['TL_CTE']['customer_portal']['customer_portal'] = \Ertnerundso\CustomerPortal\ContentElement\LegacyPortalElement::class;

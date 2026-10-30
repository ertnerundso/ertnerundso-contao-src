<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\ContentElement;

use Contao\ContentElement;
use Contao\System;
use Ertnerundso\CustomerPortal\Controller\PortalContentElementController;

/** Adapter für die bereits eingesetzten Contao-default-Layouts, kein zweites Portal. */
final class LegacyPortalElement extends ContentElement
{
    protected $strTemplate = 'ce_customer_portal';

    protected function compile(): void
    {
        $container = System::getContainer();
        $request = $container->get('request_stack')->getMainRequest();
        if ($request->attributes->get('_scope') === 'backend') {
            $this->Template->portalData = null;
            return;
        }
        $this->Template->portalData = $container->get(PortalContentElementController::class)->data($request);
    }
}

<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Controller;

use Contao\ContentModel;
use Contao\PageModel;
use Contao\CoreBundle\Controller\ContentElement\AbstractContentElementController;
use Contao\CoreBundle\DependencyInjection\Attribute\AsContentElement;
use Contao\CoreBundle\Twig\FragmentTemplate;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[AsContentElement('customer_portal', category: 'customer_portal', template: 'content_element/customer_portal')]
final class PortalContentElementController extends AbstractContentElementController
{
    public function __construct(private PortalController $portal, private RequestStack $requests) {}

    protected function getResponse(FragmentTemplate $template, ContentModel $model, Request $request): Response
    {
        if ($this->isBackendScope($request)) {
            return new Response('Kundenportal: geschützte Übersicht der angemeldeten Firma.');
        }
        $template->set('portalData', $this->data($request));
        $response = $template->getResponse();
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        return $response;
    }

    public function data(Request $request): array
    {
        // Gemeinsame Prüfung für moderne Inhaltselemente und bestehende default-Layouts.
        $main = $this->requests->getMainRequest() ?? $request;
        $path = $main->getPathInfo();
        $page = $GLOBALS['objPage'] ?? null;
        if (($path !== '/kundenbereich' && !str_starts_with($path, '/kundenbereich/'))
            || !$page instanceof PageModel || !$page->protected || (int) $page->cache > 0 || (int) $page->clientCache > 0 || $page->alwaysLoadFromCache) {
            throw new AccessDeniedException('Das Portal-Inhaltselement benötigt eine geschützte Kundenbereich-Seite.');
        }
        $data = $this->portal->viewData($main);
        $GLOBALS['TL_CSS'][] = $data['assetBase'].'/site.css';
        $GLOBALS['TL_CSS'][] = $data['assetBase'].'/css/portal.css';
        $GLOBALS['TL_JAVASCRIPT'][] = '/bundles/ertnerundsocustomerportal/portal.js';
        return $data;
    }
}

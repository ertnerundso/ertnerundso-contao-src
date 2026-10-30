<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Controller;

use Ertnerundso\CustomerPortal\Repository\PortalRepository;
use Ertnerundso\CustomerPortal\Security\TenantContext;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Twig\Environment;

#[Route(defaults: ['_scope' => 'frontend'])]
final class PortalController
{
    public function __construct(private TenantContext $context, private PortalRepository $repository, private Environment $twig, private string $websiteAssetBase) {}

    #[Route('/kundenbereich/portal/{view}', name: 'eunds_customer_portal', defaults: ['view' => 'uebersicht'], requirements: ['view' => 'uebersicht|projekte|pruefen|abgaben|team'], methods: ['GET'])]
    public function page(Request $request, string $view): Response
    {
        try {
            $data = $this->viewData($request, $view);
        } catch (AccessDeniedException $exception) {
            return $this->privateResponse(new Response($this->twig->render('@ErtnerundsoCustomerPortal/access.html.twig', ['assetBase' => $this->websiteAssetBase]), 403));
        }
        return $this->privateResponse(new Response($this->twig->render('@ErtnerundsoCustomerPortal/portal.html.twig', $data)));
    }

    public function viewData(Request $request, string $view = 'uebersicht'): array
    {
        $tenant = $this->context->current();
        $query = mb_substr(trim($request->query->getString('q')), 0, 100);
        return [
            'titles' => ['uebersicht' => 'Übersicht', 'projekte' => 'Projekte', 'pruefen' => 'Prüfen', 'abgaben' => 'Abgaben', 'team' => 'Team und Einstellungen'],
            'tenant' => $tenant, 'view' => $view, 'query' => $query, 'assetBase' => $this->websiteAssetBase,
            'projects' => $this->repository->projects($tenant, $query), 'reviews' => $this->repository->reviews($tenant),
            'deliveries' => $this->repository->deliveries($tenant), 'activity' => $this->repository->activity($tenant),
            'team' => $view === 'team' ? $this->repository->team($tenant) : [],
        ];
    }

    #[Route('/kundenbereich/api/projekte/{id}', name: 'eunds_customer_project', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function project(int $id): JsonResponse
    {
        $response = new JsonResponse($this->repository->project($this->context->current(), $id));
        $this->privateResponse($response);
        return $response;
    }

    private function privateResponse(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        return $response;
    }
}

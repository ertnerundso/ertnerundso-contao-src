<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class PrivateResponseSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        // Gilt auch für Fehlerantworten, die vor einem Controller entstehen.
        return [KernelEvents::RESPONSE => ['protect', -1024]];
    }

    public function protect(ResponseEvent $event): void
    {
        $path = $event->getRequest()->getPathInfo();
        if (!$event->isMainRequest() || (!str_starts_with($path, '/kundenbereich/') && $path !== '/kundenbereich')) { return; }
        $headers = $event->getResponse()->headers;
        $headers->set('Cache-Control', 'private, no-store, max-age=0');
        $headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $headers->set('Referrer-Policy', 'no-referrer');
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
    }
}

<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal;

use Symfony\Component\HttpKernel\Bundle\Bundle;

final class ErtnerundsoCustomerPortalBundle extends Bundle
{
    public function getPath(): string
    {
        return dirname(__DIR__);
    }
}

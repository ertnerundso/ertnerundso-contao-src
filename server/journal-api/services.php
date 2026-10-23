<?php

declare(strict_types=1);

use App\JournalApiController;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return static function (ContainerConfigurator $configurator): void {
    $configurator->services()
        ->set(JournalApiController::class)
        ->public()
        ->autowire()
        ->autoconfigure()
        ->tag('controller.service_arguments')
        ->arg('$tokenFile', '/run/secrets/journal_api_token')
        ->arg('$publishTokenFile', '/run/secrets/journal_api_publish_token')
        ->arg('$archiveDe', 3)
        ->arg('$archiveEn', 4)
    ;
};

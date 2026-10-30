<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Backend;

/** Native DCA-Definitionen: Schema und Backend verwenden dieselbe Feldquelle. */
final class PortalSchema
{
    public const TABLES = ['firma', 'projekt', 'phase', 'version', 'kommentar', 'zeichnung', 'freigabe', 'abgabe', 'ereignis'];

    public static function fields(string $entity): array
    {
        $fields = [
            'id' => ['sql' => ['type' => 'integer', 'unsigned' => true, 'autoincrement' => true]],
            'tstamp' => ['sql' => "int(10) unsigned NOT NULL default 0"],
        ];
        if ($entity !== 'firma') {
            $fields['firma_id'] = self::relation('Firma', 'tl_portal_firma', 'name');
        }
        $specific = match ($entity) {
            'firma' => [
                'name' => self::text('Firma', true), 'kurznummer' => self::text('Kundennummer'),
                'mitgliedergruppe' => self::relation('Eigene Mitgliedergruppe', 'tl_member_group', 'name'),
                'aktiv' => self::checkbox('Zugang aktiv'), 'nda' => self::checkbox('NDA-Projekt als Standard'),
                'onedrive_ordner_id' => self::text('OneDrive-Ordner-ID'), 'es_id' => self::text('ES-ID'),
            ],
            'projekt' => [
                'titel' => self::text('Projektname', true),
                'vorlage' => self::choice('Phasenvorlage', ['animation' => 'Animation', 'standbild' => 'Standbild / Rendering', 'print' => 'Print / Montageanleitung']),
                'korrekturlaeufe_inklusive' => self::number('Korrekturläufe je Phase', 1),
                'onedrive_ordner_id' => self::text('OneDrive-Ordner-ID'),
                'referenz' => self::choice('Referenzfreigabe', ['nein' => 'Nein', 'ja' => 'Ja', 'datum' => 'Ab Datum', 'anonym' => 'Nur anonym']),
                'archiviert' => self::checkbox('Archiviert'),
            ],
            'phase' => [
                'projekt_id' => self::relation('Projekt', 'tl_portal_projekt', 'titel'),
                'name' => self::text('Phase', true), 'reihenfolge' => self::number('Reihenfolge'),
                'status' => self::choice('Status', ['arbeit' => 'In Arbeit', 'pruefung' => 'Zur Prüfung', 'korrektur' => 'Korrektur angefordert', 'freigegeben' => 'Freigegeben']),
                'korrekturlaeufe' => self::number('Angeforderte Korrekturläufe'),
            ],
            'version' => [
                'phase_id' => self::relation('Phase', 'tl_portal_phase', 'name'),
                'nummer' => self::number('Version', 1), 'onedrive_item_id' => self::text('OneDrive-Datei-ID', true),
                'dateiname' => self::text('Dateiname', true),
                'typ' => self::choice('Medientyp', ['video' => 'Video', 'bild' => 'Bild', 'pdf' => 'PDF']),
                'fps' => self::text('Bildrate (z. B. 25 oder 30000/1001)'),
                'freigeschaltet_am' => self::date('Freigeschaltet ab'),
            ],
            'kommentar' => [
                'version_id' => self::relation('Version', 'tl_portal_version', 'dateiname'),
                'mitglied_id' => self::relation('Mitglied', 'tl_member', 'username'),
                'text' => self::longText('Kommentar'), 'zeit_von' => self::decimal('Sekunden von'),
                'zeit_bis' => self::decimal('Sekunden bis'), 'position_x' => self::decimal('X (0–1)'),
                'position_y' => self::decimal('Y (0–1)'), 'seite' => self::number('PDF-Seite'),
                'status' => self::choice('Status', ['offen' => 'Offen', 'erledigt' => 'Erledigt', 'rueckfrage' => 'Rückfrage']),
                'antwort_auf' => self::number('Antwort auf Kommentar'),
            ],
            'zeichnung' => ['kommentar_id' => self::relation('Kommentar', 'tl_portal_kommentar', 'id'), 'formen' => self::longText('Vektorformen (JSON)')],
            'freigabe' => [
                'phase_id' => self::relation('Phase', 'tl_portal_phase', 'name'),
                'version_id' => self::relation('Version', 'tl_portal_version', 'dateiname'),
                'mitglied_id' => self::relation('Mitglied', 'tl_member', 'username'),
                'art' => self::text('Art'), 'mehraufwand_bestaetigt' => self::checkbox('Mehraufwand bestätigt'),
                'zeitpunkt' => self::date('Zeitpunkt'),
            ],
            'abgabe' => [
                'projekt_id' => self::relation('Projekt', 'tl_portal_projekt', 'titel'),
                'onedrive_item_id' => self::text('OneDrive-Datei-ID', true), 'dateiname' => self::text('Dateiname', true),
                'format' => self::text('Format'), 'groesse' => self::bigNumber('Dateigröße (Bytes)'),
                'freigeschaltet_am' => self::date('Freigeschaltet ab'),
            ],
            'ereignis' => [
                'projekt_id' => self::relation('Projekt', 'tl_portal_projekt', 'titel'),
                'art' => self::text('Art'), 'mitglied_id' => self::number('Mitglied'),
                'daten' => self::longText('Metadaten (JSON)'), 'zeitpunkt' => self::date('Zeitpunkt'),
                'abgeholt_am' => self::date('Letzter Abruf'),
            ],
            default => throw new \InvalidArgumentException('Unbekannte Portal-Tabelle.'),
        };
        return $fields + $specific;
    }

    public static function definition(string $entity): array
    {
        $fields = self::fields($entity);
        $names = array_diff(array_keys($fields), ['id', 'tstamp']);
        $title = match ($entity) { 'firma' => 'name', 'projekt' => 'titel', 'phase' => 'name', 'version', 'abgabe' => 'dateiname', default => 'id' };
        $immutable = in_array($entity, ['freigabe', 'ereignis'], true);
        $keys = ['id' => 'primary'];
        foreach (['firma_id', 'projekt_id', 'phase_id', 'version_id', 'kommentar_id'] as $key) {
            if (isset($fields[$key])) { $keys[$key] = 'index'; }
        }
        if ($entity === 'firma') { $keys['mitgliedergruppe'] = 'unique'; }
        return [
            'config' => [
                'dataContainer' => \Contao\DC_Table::class, 'enableVersioning' => true,
                'notEditable' => $immutable, 'notCreatable' => $immutable, 'notDeletable' => true,
                'onload_callback' => [[BackendGuard::class, 'adminOnly']],
                'sql' => ['keys' => $keys],
            ],
            'list' => [
                'sorting' => ['mode' => 1, 'fields' => [$title], 'flag' => 1, 'panelLayout' => 'filter;search,limit'],
                'label' => ['fields' => [$title], 'format' => '%s'],
                'operations' => $immutable ? ['show'] : ['edit', 'show'],
            ],
            'palettes' => ['default' => implode(',', $names)],
            'fields' => $fields,
        ];
    }

    private static function text(string $label, bool $mandatory = false): array
    {
        return ['label' => [$label, ''], 'inputType' => 'text', 'eval' => ['mandatory' => $mandatory, 'maxlength' => 255, 'tl_class' => 'w50'], 'sql' => "varchar(255) NOT NULL default ''"];
    }

    private static function longText(string $label): array
    {
        return ['label' => [$label, ''], 'inputType' => 'textarea', 'eval' => ['tl_class' => 'clr', 'allowHtml' => false], 'sql' => 'text NULL'];
    }

    private static function number(string $label, int $default = 0): array
    {
        return ['label' => [$label, ''], 'inputType' => 'text', 'default' => $default, 'eval' => ['rgxp' => 'natural', 'tl_class' => 'w50'], 'sql' => "int(10) unsigned NOT NULL default $default"];
    }

    private static function bigNumber(string $label): array
    {
        $field = self::number($label); $field['sql'] = 'bigint unsigned NOT NULL default 0'; return $field;
    }

    private static function decimal(string $label): array
    {
        return ['label' => [$label, ''], 'inputType' => 'text', 'eval' => ['rgxp' => 'digit', 'tl_class' => 'w50'], 'sql' => 'decimal(14,6) NULL'];
    }

    private static function date(string $label): array
    {
        $field = self::number($label); $field['eval'] = ['rgxp' => 'datim', 'datepicker' => true, 'tl_class' => 'w50 wizard']; return $field;
    }

    private static function checkbox(string $label): array
    {
        return ['label' => [$label, ''], 'inputType' => 'checkbox', 'eval' => ['tl_class' => 'w50'], 'sql' => "char(1) NOT NULL default ''"];
    }

    private static function choice(string $label, array $options): array
    {
        return ['label' => [$label, ''], 'inputType' => 'select', 'options' => $options,
            'default' => array_key_first($options), 'eval' => ['mandatory' => true, 'tl_class' => 'w50'],
            'sql' => "varchar(32) NOT NULL default '".array_key_first($options)."'"];
    }

    public static function relation(string $label, string $table, string $column): array
    {
        $field = self::number($label);
        $field['inputType'] = 'select'; $field['foreignKey'] = $table.'.'.$column;
        $field['eval'] += ['mandatory' => true, 'includeBlankOption' => true, 'chosen' => true];
        $field['save_callback'] = [[BackendGuard::class, 'validateRelation']];
        return $field;
    }
}

/**
 * Utility function to safely map relations.
 *
 * @param relation The relation from the domain (object | id | null | undefined).
 * @param mapper The mapper with a `toPersistence` method (optional).
 * @returns A persistence entity or undefined.
 */
export function mapRelation<TDomain, TPersistence>(
  relation: TDomain | string | number | null | undefined,
  mapper?: { toPersistence: (entity: TDomain) => TPersistence },
): TPersistence | { id: string | number } | undefined {
  if (relation === undefined || relation === null) {
    return undefined;
  }

  if (typeof relation === 'object') {
    if (mapper) {
      return mapper.toPersistence(relation as TDomain);
    }
    return relation as unknown as TPersistence;
  }

  return { id: relation } as unknown as TPersistence;
}

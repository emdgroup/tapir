import { expectAssignable, expectNotAssignable } from 'tsd';

import {
    DomainName,
    CreateDomainRequestJson,
    BoolOrString,
    TeamInvitation,
    TeamInvitationState,
} from '../tmp/random/types';

expectAssignable<DomainName>('string');

expectAssignable<CreateDomainRequestJson>({
    domainName: 'foobar',
});

expectAssignable<BoolOrString>({
    op: 'foo',
    path: 'name',
    value: '1',
});

expectNotAssignable<BoolOrString>({
    op: 'foo',
    value: '1',
});

// enum itself is not nullable
expectNotAssignable<TeamInvitationState>(null);
expectAssignable<TeamInvitation>({ stateInlined: null });
expectAssignable<TeamInvitation>({ stateRef: null });

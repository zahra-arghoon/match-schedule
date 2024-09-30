export const definitions = {
    SuperAdminLogin: {
        username: 'username',
        password: 'password'
    },
    EventTiming: {
        $gameTime: 60,
        $halfTime: 15,
        $gapTime: 10,
        extendPitchTime: false,
        addPitch: false
    },
    EventUpdate: {
        startDate: '2023-02-10 08:00',
        endDate: '2023-02-10 15:00',
        pitchNumber: 8
    },
    MatchAddGap: {
        orderIndex: 3,
        pitchIndex: 370,
        gapTime: 30,
        extendPitchTime: true
    },
    MoveGap: {
        oldOrderIndex: 12,
        newOrderIndex: 22,
        pitchIndex: 22,
        newPitchIndex: 332,
        extendPitchTime: true
    },
    MatchDelGap: {
        orderIndex: 3,
        pitchIndex: 370
    },
    MatchMove: {
        matchId: 233,
        newOrderIndex: 2,
        pitchIndex: 534,
        extendPitchTime: false
    },
    Group: {
        name: 'my group'
    },
    TeamUpdate: {
        teamId: 1,
        groupId: 1
    },
    TeamRemove: {
        teamId: 1
    },
    TeamCreate: {
        name: 'my group',
        logo: 'example.png'
    },
    Timing: {
        gameTime: 60,
        halfTime: 30,
        gapTime: 10
    }
};

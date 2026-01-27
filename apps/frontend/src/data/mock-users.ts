export type UserStatus = 'Active' | 'Offline' | 'Away'

export interface User {
    id: string
    name: string
    email: string
    department: string
    designation: string
    status: UserStatus
    avatarUrl: string
    badges?: { color: string, text: string }[]
}

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Alex Rivera',
        email: 'alex.r@av-corp.com',
        department: 'IT INFRASTRUCTURE',
        designation: 'Senior AV Technician',
        status: 'Active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0J-3ZO4fHlcrIIN8ytmShNfo7-e6QG72bFPhYQpEKATeMfQw73bLt5wVslpELQKTQyqHRPKT-8WfSJC8vxpc0CUhHvV2guVY_Gee5x0zwv8590LW_0u7I8vJZu6FXQYTwNpPHSY8APO2Jh2lKx-1dIUWU-LKJ-fw32sT0FkHiLEz16xW0ZaTxKCqRwEiIpcW1E8ONq4tmAB1_oLGikQLQYRqaP1Emx5_mbhqM554EFRp1qbQ-Yl9ItGYVIpvMQMHaOBEzpsupE-s',
        badges: [{ color: 'blue', text: 'IT INFRASTRUCTURE' }]
    },
    {
        id: '2',
        name: 'Sarah Jenkins',
        email: 's.jenkins@av-corp.com',
        department: 'OPERATIONS',
        designation: 'Logistics Manager',
        status: 'Away',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3-RRagRqHQPvD-jm-58gQyb6eiYqJCdaF-Fr4YfoVo3KAlB1OsF-JfCCfOVlPrct8wz48eWqtp5mENfxsHp08qOEHx4L91XIVHkjTNhVAHbGHVN6uEZ6lqDaeHt44jYeXY6hzLP2IKCyS8wp0KSDMXTF6NS8PQV7xjqju4sIEU8rkB1HsrK-zpqxskTo3SB2MlRnMjqv97t_HX8Q5ZoRXhXBEQrbiyEwG52EAbsyh8r5h7u6fvzGZ4nwgFIDnZ3qemUkJiCVrMgw',
        badges: [{ color: 'amber', text: 'OPERATIONS' }]
    },
    {
        id: '3',
        name: 'Michael Chen',
        email: 'm.chen@av-corp.com',
        department: 'IT INFRASTRUCTURE',
        designation: 'System Administrator',
        status: 'Offline',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxCHWKsTHY1PbJi1HLg9eR0bJedsd-nFdmMDq4zH-QOXN4q-IarzXGw-0SVDcx8wJZXTu-uFFmPDJc-Qu8o7x0V84BpF2uvztJZE56auQ5lulrx4Zm411oowMpvyae73E0FtxCb8qprf1Qo_GsV-XIlwBtn4ZkVlThHnpSfbeK_zAjqhJuL2PNOvQysNjf7YDbuYamEmwRnKxD295zKMVJANAA9xyWAH43urplF8_qqLAeMlp_SP212SOZsY1EjhlDNxfiUu7wPPQ',
        badges: [{ color: 'blue', text: 'IT INFRASTRUCTURE' }]
    },
    {
        id: '4',
        name: 'Lena Vo',
        email: 'l.vo@av-corp.com',
        department: 'CREATIVE SERVICES',
        designation: 'Visual Lead',
        status: 'Active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ4327y1a09nMP98AAZR1fAf4qi8lyY8sTmVoI9LB5bwJtbtEgVn39TZ8cq0SfVZ7oXB42DTOCvn71nXuvvE4zdDQSECiE6pQ0NXYVkN9dNAhGJYxnP5YPW05AbL-PGoTE0WZbp6etpCkqJscVEiKefHM1v0BLdyNkDbI_FMmSeXxPiy-1D3e91j5t6iyq-Jn6iliWIFLL8W1XdSdVcjf2QRn1zg-miRuFImjHNdPKD1ova-OnjITI7Uq3FsjGjN4JeVKMgONaBew',
        badges: [{ color: 'purple', text: 'CREATIVE SERVICES' }]
    },
    {
        id: '5',
        name: 'David Miller',
        email: 'd.miller@av-corp.com',
        department: 'IT INFRASTRUCTURE',
        designation: 'AV Support Specialist',
        status: 'Active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvhMurM2peMRLtdhb943hnwltF9isaqStpbXzr2IL9QSKKnnI7D6CB1YMGWJ1qkvqitBV9xSv1WdqT7tLeBJbG0YKrc6CLRZWhLlfpk9F9NP2TvOQDt1osg8xb2qt93j7JEBhQGhimJO_n4lsgA_kR4TwY2L0qKT-5mSinJ2ub3fyfWKG8kkzu5WXPOecCfA2twdduS6mD2xsPXuErzDuvJHp4iOUxlFb1f973FDkzXuMdWsiEKgyMxfr6uhR0BTgoVu0z8nV4HA4',
        badges: [{ color: 'blue', text: 'IT INFRASTRUCTURE' }]
    }
]

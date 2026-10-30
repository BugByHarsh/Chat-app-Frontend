import { Avatar } from '@mui/material';
import React from 'react';

export default function AvatarText({ name, profile }) {
    function stringToColor(string) {
        let hash = 0;
        let i;
        for (i = 0; i < string.length; i += 1) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (i = 0; i < 3; i += 1) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        return color;
    }

    function stringAvatar(name) {
        const words = name.split(' ');
        let initials;
        if (words.length === 2) {
            initials = `${words[0][0]}${words[1][0]}`;
        } else {
            initials = name[0];
        }

        return {
            sx: {
                bgcolor: stringToColor(name),
                width: profile ? '100px' : "40px",
                height: profile ? '100px' : "40px",
                borderRadius: "50%",
                flexShrink: 0,
                fontSize: profile ? '50px' : "",
            },
            children: initials,
        };
    }

    return (
            <Avatar className="my-2 mr-1" {...stringAvatar(name)} />
            
    );
}

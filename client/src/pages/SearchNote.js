import React from 'react'
import { useParams } from 'react-router-dom'
import SearchRes from '../components/SearchRes'
import SEO from '../components/SEO'
import Loading from '../components/Loading.js'
import "../styles/SearchNote.css"

const SearchNote = () => {
    const { query } = useParams();
    const [res, setRes] = React.useState();
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        try {
            setIsLoading(true);
            fetch(`/api/v1/dashboard/search/${query}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data !== undefined) {
                        if (data.notes !== undefined && data.notes.length > 0) {
                            const sRes = data.notes.map((note) => {
                                return <SearchRes
                                    key={note._id}
                                    id={note._id}
                                    title={note.title}
                                />
                            })
                            setRes(sRes);
                        }
                        else
                        {
                            const sRes = <div>
                            <h3 style = {{"color" : "#FFC700" }}>No Matching Result.</h3>
                            <h4 style = {{"color" : "#FFC700"}}> Try Another Query </h4>
                            </div>
                            setRes(sRes);
                        }
                    }
                    else {
                        console.log("error in search result formation")
                    }
                });
                setIsLoading(false);
        }
        catch (error) {
            console.log(error);
        }
    }, [query]);

    return (
        <div className="searchNote">
            <SEO
                title="Search Notes - Noteracy"
                description="Always have your Notes at the tip of your finger with Search"
                name="@lamajribbahs"
                image="../assets/icons/icon96.ico" />
            {isLoading ? (
                <Loading />
            ) : (
                <div className="searchResult">
                {res}
            </div>
            )}
        </div>
    )
}

export default SearchNote
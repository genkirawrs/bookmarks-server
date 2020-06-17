function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Bookmark 1',
      description: 'description 1',
      url: 'https://google.com',
      rating: 5
    },
    {
      id: 2,
      title: 'Google',
      description: 'The ultimate search engine',
      url: 'https://google.com',
      rating: 4
    },
    {
      id: 3,
      title: 'Bookmark 3',
      description: 'description 3',
      url: 'https://youtube.com',
      rating: 4
    },
    {
      id: 4,
      title: 'Bookmark 4',
      description: 'description 4',
      url: 'https://etsy.com',
      rating: 2
    },
  ];
}

module.exports = {
  makeBookmarksArray,
}
